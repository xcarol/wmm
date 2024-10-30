# Where's My Money

A Personal 'Fintech' Application  

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/fbcb6ed5caa949cb979faf1c3d2e1bf2)](https://app.codacy.com/gh/xcarol/wmm/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)  

## Development environment

### Vs Code

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### MySql Server

Database is located in the _server_ directory.

The _sqlserver.sh_ script uses the _docker-compose.yml_ file, located in the _database_ directory, to create a local mysql database.  
This database will reside in the _mysql_ directory under the _server_ directory of the project.  

### Backup / Restore

This application relies in the _mysqldump_ application to restore the database.  
Make sure _mysqldump_ is installed and accessible by _$PATH_.  

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
- -m to select between Local or Docker Hub to push the images

A typical call to build the server would be: `./docker-setup.sh -u xcarol -t server -m local`  
A typical call to build the client would be: `./docker-setup.sh -u xcarol -t client -m local -v http://192.168.1.201:3000` here _192.168.1.201_ is the production server IP.  

In your production environment

- Install docker with _docker-compose-plugin_  
- Copy the _docker-compose.yml_ file to a directory of your choice.
- Create a _.env_ file in the same directory and add:

```
MYSQL_ROOT_PASSWORD=secret_mysql
DB_DATABASE=database_name
DB_USER=user_name
DB_PASSWORD=user_password
SECRET_ID=secret_id
SECRET_KEY=secret_key
```

- where 'secret_mysql' is the password you choose for the database root user
- 'database_name', 'user_name' and 'user_password' are... well, I guess you'll kown
- and 'secret_id' and 'secret_key' are your [GoCardless](#gocardless) secret id and key

### systemd

Follow these steps to setup the wmm system service.  

Copy the file named _./system/wmm.service_ to _/etc/systemd/system/wmm.service_ in the production server.  
Set your installation path at the _WorkingDirectory_ and _Environment_ variables.  

Load new service file 
```
sudo systemctl daemon-reload
```

Enable the service
```
sudo systemctl enable wmm.service
```

Start the service
```
sudo systemctl start wmm.service
```

Stop the service
```
sudo systemctl stop wmm.service
```

Check the service status
```
sudo systemctl status wmm.service
```

Watch the service logs
```
sudo journalctl -u wmm.service -p debug -xe
```

### GoCardless

With this integration, transactions are retrieved directly from the bank. This indeed eliminates the "Duplicates problem" and obsoletes the CSV Import method.

CSV Import is still maintained in case the GoCardless solution is not an option.

Go to [GoCardless](https://bankaccountdata.gocardless.com/login) sign-in/sign-up and create your keys to operate with GoCardless and be able to import the transactions directly from your bank.

## User Guide

After importing transactions, you will need to categorize them to enable flexible data browsing.

There are two ways to import transactions: using CSV files or connecting directly to the bank.

Most banks provide a way to download your transactions locally. If this is possible, you can download a CSV file or another type of Excel file. If you can only obtain an Excel file, you can convert it using LibreOffice, although this may make using the application more tedious. The preferred method is to use the GoCardless integration.

Use the **_Import_** and **_Banks Configuration_** options to import transactions. For the **_Import_** option, you'll need CSV files. With the **_Banks Configuration_** option, you'll first configure your bank account before being able to import its transactions.

To categorize transactions, go to the **_Categorize_** view. Click the **_Zoom_** button with the 'description' and 'category' fields left blank to find uncategorized transactions. Use the 'description' filter field to locate specific transactions. The 'category' filter field can be used to re-categorize transactions as needed.

You can select multiple transactions, choose an existing category or type a new one, and then click the **_Apply_** button to assign the selected (or newly typed) category to the chosen transactions.

A more efficient way to categorize is by using filters. Select a single transaction and click on the **_Create New Filter_** button. A dialog box will appear where you can configure the new filter with three fields: the **Category**, which is the category to be assigned to transactions matching the filter, a **Filter** (a part or full description of the transaction), and an optional **Label** for easy identification. Once created, the filter can be applied to all matching transactions.

After setting up filters, the **_Apply All Filters_** button will be useful for categorizing new transactions based on existing filters.

In the **_Filters_** view, you can manage categories and filters—renaming, deleting, or adding new ones.

The **_SQL Commands_** view provides an open window to the database, allowing you to query as needed.

Use the **_Browse_** submenu options to view your data as transactions, categories, or in a timeline.

## Historic

### Duplicates

**(jump to GoCardless unless you will import transactions manually with CSV files)**

~~What are duplicate transactions?~~

~~When you import new transactions, some of the first ones might already be in the database because they were the last transactions from the previous import. In this case, when searching for duplicates, you can manually delete the duplicated transactions.~~

~~Another scenario for finding duplicates is when you see two identical transactions, but they are actually different.~~

~~Since bank transactions may not include a timestamp, only the date appears in the transaction details. Imagine buying a €1 drink in the morning and the same drink at the same store for the same price in the evening. You'd see a duplicate transaction that's a false positive. In this case, you can mark them as non-duplicates. The next time you search for duplicates, they won't appear, but they will still be counted as separate transactions.~~

~~Second approach~~
~~The duplicates problem is solved by omitting yesterday's and today's transactions from the import. These transactions will be consolidated and imported in full the following day, ensuring complete data for all time zones. This approach reduces data freshness but improves system robustness.~~  

#### Third approach

Transactions must be added in bulk operations. Any 'conflicting' transactions will be deleted before the import. 'Conflicting' transactions are those already in the database whose date falls within the date range of the bulk transactions being imported.  

It is IMPORTANT to import transactions for full days. If you perform an import in the afternoon and then make a purchase in the evening, that transaction could be lost if the next import does not include the last day of the previous import. It is ADVISED to always re-import the last day of the previous import to avoid losing these transactions.   
