const { randomUUID } = require('crypto');
const { addBank, getBankNames, getBankBalance } = require('./database');
const NordigenClient = require('nordigen-node');

const COUNTRY = process.env.COUNTRY || 'ES';

let nordigenClient = null;
let nordigenToken;

const getNordigenClient = async () => {
  if (nordigenClient === null) {
    nordigenClient = new NordigenClient({
      secretId: process.env.SECRET_ID,
      secretKey: process.env.SECRET_KEY,
    });

    nordigenToken = await nordigenClient.generateToken();
    nordigenClient.token = nordigenToken.access;
  }

  return nordigenClient;
};

module.exports = (app) => {
  app.get('/banks/institutions', async (req, res) => {
    try {
      const client = await getNordigenClient();
      res.json(await client.institution.getInstitutions({ country: COUNTRY }));
    } catch (err) {
      res.status(err.code).send(err);
    }
  });

  app.get('/banks/register/init', async (req, res) => {
    try {
      const { institutionId, redirectUrl } = req.query;
      const client = await getNordigenClient();

      const init = await client.initSession({
        redirectUrl,
        institutionId,
        referenceId: randomUUID(),
      });

      res.json({
        link: init.link,
        requisitionId: init.id,
      });
    } catch (err) {
      res.status(err.code).send(err);
    }
  });

  app.get('/banks/register/complete', async (req, res) => {
    try {
      const { requisitionId } = req.query;

      const client = await getNordigenClient();
      const requisitionData = await client.requisition.getRequisitionById(requisitionId);
      const accountId = requisitionData.accounts[0];
      const account = client.account(accountId);

      const metadata = await account.getMetadata();
      const details = await account.getDetails();

      await addBank(details.account.displayName, metadata.institution_id, requisitionId);
      res.json(metadata);
    } catch (err) {
      res.status(err.code).send(err);
    }
  });

  app.get('/banks/names', async (req, res) => {
    try {
      res.json(await getBankNames());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
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
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });
};
