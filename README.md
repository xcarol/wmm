# Where's My Money

A Personal 'Fintech' Application  

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/fbcb6ed5caa949cb979faf1c3d2e1bf2)](https://app.codacy.com/gh/xcarol/wmm/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)  

## Development environment

## Vs Code

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## MySql Server

Database is located in the _server_ directory.

The _sqlserver.sh_ script uses the _docker-compose.yml_ file, located in the _database_ directory, to create a local mysql database.  
This database will reside in the _mysql_ directory under the _server_ directory of the project.  

## Backup / Restore

This application relies in the _mysqldump_ application to restore the database.  
Make sure _mysqldump_ is installed and accessible by _$PATH_.  

## Application Guide

### Duplicates

~~What are duplicate transactions?~~

~~When you import new transactions, some of the first ones might already be in the database because they were the last transactions from the previous import. In this case, when searching for duplicates, you can manually delete the duplicated transactions.~~

~~Another scenario for finding duplicates is when you see two identical transactions, but they are actually different.~~

~~Since bank transactions may not include a timestamp, only the date appears in the transaction details. Imagine buying a €1 drink in the morning and the same drink at the same store for the same price in the evening. You'd see a duplicate transaction that's a false positive. In this case, you can mark them as non-duplicates. The next time you search for duplicates, they won't appear, but they will still be counted as separate transactions.~~

~~Second approach~~
~~The duplicates problem is solved by omitting yesterday's and today's transactions from the import. These transactions will be consolidated and imported in full the following day, ensuring complete data for all time zones. This approach reduces data freshness but improves system robustness.~~  

Third approach
Transactions must be added in bulk operations. Any 'conflicting' transactions will be deleted before the import. 'Conflicting' transactions are those already in the database whose date falls within the date range of the bulk transactions being imported.

It is IMPORTANT to import transactions for full days. If you perform an import in the afternoon and then make a purchase in the evening, that transaction could be lost if the next import does not include the last day of the previous import. It is ADVISED to always re-import the last day of the previous import to avoid losing these transactions.   

### GoCardless

With this integration, transactions are retrieved directly from the bank. This indeed eliminates the "Duplicates problem" and obsoletes the CSV Import method.

CSV Import is still maintained in case the GoCardless solution doesn't is an option.

