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

CSV Import is still maintained in case the GoCardless solution is not an option.

Go to [GoCardless](https://bankaccountdata.gocardless.com/login) sign-in/sign-up and create your key to operate with GoCardless and be able to import the transactions directly from your bank.

## Production environment

The docker directory, inside the system directory, contains the files needed to set up the production environment using docker.

Use the _docker-setup.sh_ shell script to build the docker images, push them to your Docker Hub repo and delete locally created images.  
Just type `$ ./docker-setup.sh` to get the help message.

### docker-setup.sh

This script is used to operate with both projects, client and server. If it is not specified in the command line it will be prompted when you run the script.  
It is also needed your Docker Hub username and if it is not specified in the command line it will be prompted when you run the script.  

__Project type and username are always required__

Use the action parameters: -b -p -d to build, push and delete images respectively.

To get the system ready for production, follow these steps:
```
./docker-setup.sh -u dockerhub_username -t server -b
./docker-setup.sh -u dockerhub_username -t server -p
./docker-setup.sh -u dockerhub_username -t client -b
./docker-setup.sh -u dockerhub_username -t client -p
```
Replace __dockerhub_username__ with your real Docker Hub username.

Now you can delete your local images if you like with:
```
./docker-setup.sh -u dockerhub_username -t server -d
./docker-setup.sh -u dockerhub_username -t client -d
```

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
* 'database_name', 'user_name' and 'user_password' are... well, I guess you kown
* and 'secret_id' and 'secret_key' are your GoCardless secret id and key

Once you have the system ready, start it with:
```
$ docker compose up -d
```

