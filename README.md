# Where's My Money

A Personal 'Fintech' Application  

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/fbcb6ed5caa949cb979faf1c3d2e1bf2)](https://app.codacy.com/gh/xcarol/wmm/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)  

## Development environment

## Vs Code

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## MySql Server

Under the _server_ directory:

The _sqlserver.sh_ script uses the _docker-compose.yml_ file, located in the _database_ directory, to create a local mysql database. This database will be created under the directory _mysql_.

Acces database through [http://localhost:8080](http://localhost:8080)  

## Backup / Restore

This application relies in the _mysqldump_ application to restore the database.  
Make sure _mysqldump_ is installed and accessible by _$PATH_.  

## Application Guide

### Duplicates

What are duplicate transactions?

When you import new transactions, some of the first ones might already be in the database because they were the last transactions from the previous import. In this case, when searching for duplicates, you can manually delete the duplicated transactions.

Another scenario for finding duplicates is when you see two identical transactions, but they are actually different.

Since bank transactions may not include a timestamp, only the date appears in the transaction details. Imagine buying a €1 drink in the morning and the same drink at the same store for the same price in the evening. You'd see a duplicate transaction that's a false positive. In this case, you can mark them as non-duplicates. The next time you search for duplicates, they won't appear, but they will still be counted as separate transactions.
