const queryAddTransaction =
  'INSERT INTO transactions (date, bank, category, description, amount) VALUES (?, ?, ?, ?, ?)';

const queryInsertTransactions =
  'INSERT INTO transactions (bank, date, description, amount) VALUES ';

const queryInsertTransactionsWithId =
  'INSERT IGNORE INTO transactions (bank, date, description, amount, transaction_id) VALUES ';

const queryBankNames = 'SELECT DISTINCT bank FROM transactions';

const queryCategoryNames =
  "SELECT DISTINCT category FROM transactions WHERE category != '' UNION SELECT DISTINCT category \
    FROM filters ORDER BY category ASC";

const queryCategoryFilters =
  "SELECT id, filter, label FROM filters WHERE category=? ORDER BY CASE WHEN label = '' THEN filter ELSE label END ASC";

const queryTransactions = 'SELECT id, bank, date, description, category, amount FROM transactions';

const queryFiltersToApply = 'SELECT id, category, filter FROM filters ORDER BY filter DESC';

const queryApplyFilter = `
  UPDATE transactions
    SET category = ?, filter_id = ?
    WHERE description LIKE CONCAT('%', REPLACE(?, '%', '%'), '%') AND category = '';
  `;

const queryUpdateTransactionsCategory = 'UPDATE transactions SET category = ? WHERE id IN(?)';

const queryBankBalances =
  'SELECT bank, SUM(amount) as balance, MAX(date) AS latest_date, MIN(date) AS first_date \
    FROM transactions WHERE bank = ? AND date >= ? AND date <= ?';

const queryCategoryBalance =
  'WITH category_transactions AS ( \
      SELECT \
        category, \
        YEAR(date) AS year, \
        MONTH(date) AS month, \
        SUM(amount) AS total_amount, \
        COUNT(*) AS transaction_count \
      FROM transactions \
    WHERE category = ? \
      AND date >= ? \
      AND date <= ? \
      GROUP BY category, YEAR(date), MONTH(date) \
    ) \
    SELECT \
      category, \
      SUM(total_amount) AS balance, \
      AVG(total_amount) AS avg_monthly_balance, \
      AVG(transaction_count) AS avg_monthly_transactions \
    FROM category_transactions \
    GROUP BY category';

const queryCategoryFiltersBalance =
  'WITH filter_transactions AS ( \
        SELECT \
          t.category as category, \
          f.filter as filter, \
          f.label as label, \
          YEAR(t.date) AS year, \
          MONTH(t.date) AS month, \
          SUM(t.amount) AS total_amount, \
          COUNT(*) AS transaction_count \
        FROM transactions t\
        JOIN filters f ON t.filter_id = f.id \
      WHERE t.category = ? \
        AND f.filter = ? \
        AND t.date >= ? \
        AND t.date <= ? \
        GROUP BY t.category, YEAR(t.date), MONTH(t.date) \
      ) \
      SELECT \
        category, filter, label, \
        SUM(total_amount) AS balance, \
        AVG(total_amount) AS avg_monthly_balance, \
        AVG(transaction_count) AS avg_monthly_transactions \
      FROM filter_transactions \
      GROUP BY category';

const queryBalancesWithoutCategoryStart =
  'SELECT description AS category, \
    amount AS balance, \
    amount AS avg_monthly_balance, \
    amount AS avg_monthly_transactions \
  FROM transactions WHERE category = ? ';

const queryBalancesWithoutCategoryDescription = 'AND description NOT LIKE ? ';
const queryBalancesWithoutCategoryEnd = 'AND date >= ? AND date <= ?';

const queryDuplicateRows =
  'SELECT id, bank, date, description, category, amount, transaction_id FROM transactions t1 \
    WHERE EXISTS ( \
        SELECT 1 \
        FROM transactions t2 \
        WHERE t1.bank = t2.bank \
        AND t1.date = t2.date \
        AND t1.description = t2.description \
        AND t1.amount = t2.amount \
        AND t1.id <> t2.id \
        AND t1.not_duplicate = FALSE \
        AND t2.not_duplicate = FALSE \
    ) \
    ORDER BY bank, date DESC';

const queryDeleteRows = 'DELETE FROM transactions WHERE id IN (?)';

const queryDeleteRowsNewerThanDate = 'DELETE FROM transactions WHERE bank = ? AND date >= ?';

const queryMarkNotDuplicateRows = 'UPDATE transactions SET not_duplicate = TRUE WHERE id IN (?)';

const queryYears = 'SELECT DISTINCT YEAR(date) as year FROM transactions';

const queryAddCategoryFilter = 'INSERT INTO filters (category, filter, label) VALUES (?, ?, ?)';

const queryBankById =
  'SELECT name, institution_id, requisition_id, validity_date, max_historical_days FROM banks where institution_id = ?';

const queryAddBank =
  'INSERT INTO banks (name, institution_id, requisition_id, validity_date, max_historical_days) VALUES (?, ?, ?, ?, ?)';

const queryUpdateBank =
  'UPDATE banks SET name = ?, requisition_id = ?, validity_date = ?, max_historical_days = ? WHERE institution_id = ?';

const queryRegisteredBanks =
  'SELECT name, institution_id, requisition_id, validity_date FROM banks';

const queryDeleteBank = 'DELETE FROM banks WHERE institution_id = ?';

const queryDeleteCategory = 'DELETE FROM filters WHERE category = ?';

const queryDeleteFilter = 'DELETE FROM filters WHERE id = ?';

const queryResetRowsCategory =
  "UPDATE transactions SET category = '', filter_id = NULL WHERE category = ?";

const queryResetRowsCategoryForAFilter =
  "UPDATE transactions SET category = '', filter_id = NULL WHERE filter_id = ?";

const queryRenameRowsCategory = 'UPDATE transactions SET category = ? WHERE category = ?';

const queryRenameCategoryFilters = 'UPDATE filters SET category = ? WHERE category = ?';

const queryUpdateFilter = 'UPDATE filters SET filter = ?, label = ? WHERE id = ?';

const queryBalancesTimelineByBankByYear =
  'SELECT \
    bank, \
    YEAR(date) AS year, \
    SUM(amount) AS total_amount, \
    COUNT(*) AS transaction_count \
  FROM transactions \
  WHERE bank = ? \
    AND date >= ? \
    AND date <= ? \
  GROUP BY bank, YEAR(date) \
  ORDER BY YEAR(date) ASC';

const queryBalancesTimelineByBankByMonth =
  'SELECT \
    bank, \
    YEAR(date) AS year, \
    MONTH(date) AS month, \
    SUM(amount) AS total_amount, \
    COUNT(*) AS transaction_count \
  FROM transactions \
  WHERE bank = ? \
    AND date >= ? \
    AND date <= ? \
  GROUP BY bank, YEAR(date), MONTH(date)';

const queryBalancesTimelineByBankByDay =
  'SELECT \
    bank, \
    YEAR(date) AS year, \
    MONTH(date) AS month, \
    DAY(date) AS day, \
    SUM(amount) AS total_amount, \
    COUNT(*) AS transaction_count \
  FROM transactions \
  WHERE bank = ? \
    AND date >= ? \
    AND date <= ? \
  GROUP BY bank, YEAR(date), MONTH(date), DAY(date)';

const queryBalancesTimelineByCategoryByYear =
  'SELECT \
    category, \
    YEAR(date) AS year, \
    SUM(amount) AS total_amount, \
    COUNT(*) AS transaction_count \
  FROM transactions \
  WHERE category = ? \
    AND date >= ? \
    AND date <= ? \
  GROUP BY YEAR(date)';

const queryBalancesTimelineByCategoryByMonth =
  'SELECT \
    category, \
    YEAR(date) AS year, \
    MONTH(date) AS month, \
    SUM(amount) AS total_amount, \
    COUNT(*) AS transaction_count \
  FROM transactions \
  WHERE category = ? \
    AND date >= ? \
    AND date <= ? \
  GROUP BY YEAR(date), MONTH(date)';

const queryBalancesTimelineByCategoryByDay =
  'SELECT \
    category, \
    YEAR(date) AS year, \
    MONTH(date) AS month, \
    DAY(date) AS day, \
    SUM(amount) AS total_amount, \
    COUNT(*) AS transaction_count \
  FROM transactions \
  WHERE category = ? \
    AND date >= ? \
    AND date <= ? \
  GROUP BY YEAR(date), MONTH(date), DAY(date)';

const queryBalancesTimelineByCategoryByUnit =
  'SELECT \
    category, \
    YEAR(date) AS year, \
    MONTH(date) AS month, \
    DAY(date) AS day, \
    amount \
  FROM transactions \
  WHERE category = ? \
    AND date >= ? \
    AND date <= ?';

const queryBalancesTimelineByCategoryFilter =
  'SELECT \
    filter, \
    YEAR(date) AS year, \
    MONTH(date) AS month, \
    DAY(date) AS day, \
    amount \
  FROM transactions t \
  JOIN filters f ON t.filter_id = f.id \
  WHERE f.category = ? \
    AND f.filter IN(?) \
    AND t.date BETWEEN ? AND ?';

module.exports = {
  queryAddTransaction,
  queryInsertTransactions,
  queryInsertTransactionsWithId,
  queryBankNames,
  queryCategoryNames,
  queryCategoryFilters,
  queryTransactions,
  queryFiltersToApply,
  queryApplyFilter,
  queryUpdateTransactionsCategory,
  queryBankBalances,
  queryCategoryBalance,
  queryCategoryFiltersBalance,
  queryBalancesWithoutCategoryStart,
  queryBalancesWithoutCategoryDescription,
  queryBalancesWithoutCategoryEnd,
  queryDuplicateRows,
  queryDeleteRows,
  queryDeleteRowsNewerThanDate,
  queryMarkNotDuplicateRows,
  queryYears,
  queryAddCategoryFilter,
  queryBankById,
  queryAddBank,
  queryUpdateBank,
  queryRegisteredBanks,
  queryDeleteBank,
  queryDeleteCategory,
  queryDeleteFilter,
  queryResetRowsCategory,
  queryResetRowsCategoryForAFilter,
  queryRenameRowsCategory,
  queryRenameCategoryFilters,
  queryUpdateFilter,
  queryBalancesTimelineByBankByYear,
  queryBalancesTimelineByBankByMonth,
  queryBalancesTimelineByBankByDay,
  queryBalancesTimelineByCategoryByYear,
  queryBalancesTimelineByCategoryByMonth,
  queryBalancesTimelineByCategoryByDay,
  queryBalancesTimelineByCategoryByUnit,
  queryBalancesTimelineByCategoryFilter,
};
