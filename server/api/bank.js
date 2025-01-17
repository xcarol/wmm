const { randomUUID } = require('crypto');
const {
  addBank,
  deleteBank,
  getBankById,
  getBankNames,
  getBankBalance,
  getRegisteredBanks,
  addTransactions,
  sqlStatus,
} = require('./database');
const NordigenClient = require('nordigen-node');
const dayjs = require('dayjs');

const COUNTRY = process.env.COUNTRY || 'ES';

let nordigenClient = null;
let nordigenToken;

// We should reuse the same client for all requests here
// until the token expires. As calls will come from the frontend,
// because of user interaction, we can generate new one each time
// a new request is made.
const getNordigenClient = async () => {
  nordigenClient = new NordigenClient({
    secretId: process.env.SECRET_ID,
    secretKey: process.env.SECRET_KEY,
  });

  nordigenToken = await nordigenClient.generateToken();
  nordigenClient.token = nordigenToken.access;

  return nordigenClient;
};

module.exports = (app) => {
  app.get('/banks/institutions', async (req, res) => {
    try {
      const client = await getNordigenClient();
      res.json(await client.institution.getInstitutions({ country: COUNTRY }));
    } catch (err) {
      res.status(err.response.status).send({
        data: err.response.data,
        nordigenToken,
      });
    }
  });

  app.get('/banks/register/init', async (req, res) => {
    try {
      const { institution_id, redirect_url } = req.query;
      const client = await getNordigenClient();

      const init = await client.initSession({
        redirectUrl: redirect_url,
        institutionId: institution_id,
        referenceId: randomUUID(),
      });

      res.json({
        link: init.link,
        requisition_id: init.id,
      });
    } catch (err) {
      res.status(err.response.status).send(err.response.data);
    }
  });

  app.get('/banks/register/complete', async (req, res) => {
    try {
      const { requisition_name, requisition_id } = req.query;

      const client = await getNordigenClient();
      const requisitionData = await client.requisition.getRequisitionById(requisition_id);
      const accountId = requisitionData.accounts[0];
      const account = client.account(accountId);
      const agreement = await client.agreement.getAgreementById(requisitionData.agreement);
      const metadata = await account.getMetadata();

      await addBank(
        requisition_name,
        metadata.institution_id,
        requisition_id,
        agreement.access_valid_for_days,
        agreement.max_historical_days,
      );
      res.json(metadata);
    } catch (err) {
      res.status(sqlStatus(err)).send(err);
    }
  });

  app.get('/banks/delete', async (req, res) => {
    try {
      const { bank_id } = req.query;
      res.json(await deleteBank(bank_id));
    } catch (err) {
      res.status(sqlStatus(err)).send(err);
    }
  });

  app.get('/banks/refresh', async (req, res) => {
    try {
      const { bank_id } = req.query;
      const bank = await getBankById(bank_id);

      const client = await getNordigenClient();
      const requisitionData = await client.requisition.getRequisitionById(bank.requisition_id);
      const accountId = requisitionData.accounts[0];
      const account = client.account(accountId);
      const dateFrom = dayjs().subtract(bank.max_historical_days, 'day').format('YYYY-MM-DD');
      const dateTo = dayjs().format('YYYY-MM-DD');
      const {
        transactions: { booked },
      } = await account.getTransactions({ dateFrom, dateTo });
      res.json(
        booked.length
          ? await addTransactions(
              booked.map((transaction) => {
                return {
                  bank: bank.name,
                  date: transaction.valueDate,
                  description:
                    transaction.creditorName ?? transaction.remittanceInformationUnstructured,
                  amount: transaction.transactionAmount.amount,
                  transactionId: transaction.internalTransactionId,
                };
              }),
            )
          : '',
      );
    } catch (err) {
      res.status(sqlStatus(err)).send(err);
    }
  });

  app.get('/banks/registered', async (req, res) => {
    try {
      res.json(await getRegisteredBanks());
    } catch (err) {
      res.status(sqlStatus(err)).send(err);
    }
  });

  app.get('/banks/names', async (req, res) => {
    try {
      res.json(await getBankNames());
    } catch (err) {
      res.status(sqlStatus(err)).send(err);
    }
  });

  app.get('/banks/balance', async (req, res) => {
    try {
      const bank = req.query.bank;
      let startDate = new Date(
        isNaN(Date.parse(req.query.start)) ? '1970/01/01' : req.query.start,
      ).toISOString();
      let endDate = new Date(
        isNaN(Date.parse(req.query.end)) ? Date.now() : req.query.end,
      ).toISOString();

      res.json(await getBankBalance(bank, startDate, endDate));
    } catch (err) {
      res.status(sqlStatus(err)).send(err);
    }
  });
};
