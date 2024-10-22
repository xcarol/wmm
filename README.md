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

**(jump to GoCardless unless you will import transactions manually with CSV files)**

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

CSV Import is still maintained in case the GoCardless solution is not an option.

Go to [GoCardless](https://bankaccountdata.gocardless.com/login) sign-in/sign-up and create your key to operate with GoCardless and be able to import the transactions directly from your bank.

## Production environment

The ./system/docker directory contains the files needed to set up the production environment using docker.

### docker-setup.sh

Use the _docker-setup.sh_ tool to build the docker images and push them to your Docker Hub account.  
Just type `$ ./docker-setup.sh` to get the help message.

This tool is used to operate with both projects, client and server. It accepts the parameters in the command line, but if not specified, they will be asked interactivelly.

What's needed:
- -t to select between client or server project
- -u to set the docker hub user name (password is always asked interactivelly)
- -v to set the URL for the client to access the server (This is the VITE_API_URL variable in the client project)

A tipical call to build the server would be: `./docker-setup.sh -u xcarol -t server`  
A tipical call to build the client would be: `./docker-setup.sh -u xcarol -t client -v http://192.168.1.201:3000` here _192.168.1.201_ is the production server IP.  

In your production environment
* Install docker with _docker-compose-plugin_  
* Copy the _docker-compose.yml_ file to a directory of your choice.
* Create a _.env_ file in the same directory and add:
```
MYSQL_ROOT_PASSWORD=secret_mysql
DB_DATABASE=database_name
DB_USER=user_name
DB_PASSWORD=user_password
SECRET_ID=secret_id
SECRET_KEY=secret_key
```
* where 'secret_mysql' is the password you choose for the database root user
* 'database_name', 'user_name' and 'user_password' are... well, I guess you'll kown
* and 'secret_id' and 'secret_key' are your [GoCardless](#gocardless) secret id and key

Once you have the system ready, start it with:
```
$ docker compose up -d
```

And stop it with:
```
$ docker compose down
```

