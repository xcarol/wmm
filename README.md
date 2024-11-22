# Where's My Money

A Personal 'Fintech' application

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/fbcb6ed5caa949cb979faf1c3d2e1bf2)](https://app.codacy.com/gh/xcarol/wmm/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

**Where's My Money** is a self-hosted application designed to help you manage your personal finances without relying on the specific features or tools provided by individual banks. The application allows you to consolidate and analyze your financial data at home, ensuring full control and privacy over your information.

Unlike other solutions that require sharing sensitive data between banks or using third-party aggregators, this application leverages GoCardless, a free, private API that acts as a secure intermediary between your bank and the app. This ensures that your banking data remains confidential and is not shared with any unnecessary third parties.

With Personal Finance Manager, you can:

- Centralize your banking data across multiple accounts.
- View and analyze your latest transactions.
- Enjoy full control over your financial information in a secure environment.

Note: GoCardless integration is the only external dependency, serving solely as a bridge to retrieve data from your bank.

**Features**

- **Import Transactions:** Retrieve and import your bank transactions using the GoCardless API.
- **Customizable Categories and Filters:** Organize your transactions with personalized categories and filters tailored to your needs.
- **Advanced Transaction Exploration:**
  - Filter transactions by start date, end date, bank, or category.
  - Analyze transactions within a selected annual period, displaying the proportion of expenses dedicated to each category.
- **Category-Based Insights:** View annual spending breakdowns by category to better understand your financial habits.
- **Cumulative Spending Visualization:** Explore accumulated expenses over time for one or more categories. Visualize spending trends using line or bar charts, with data aggregated by months or years.

## Usage Instructions

### Initial Setup

1. **Add a Bank:**  
   Begin by adding a bank to the application. This process redirects you to **GoCardless**, which then connects you to your bank for authorization. Once the authorization is complete, you'll be redirected back to the application.

2. **Import Transactions:**  
   After setting up a bank, fetch its transactions by performing a "refresh." This action retrieves the latest transactions from the bank.
   - Note: The application does not connect to your bank automatically. You will need to manually refresh transactions periodically to keep the data up-to-date.

### Managing Transactions

1. **Categorize Transactions:**

   - Upon importing transactions for the first time, categorize them according to your preferences.
   - Initially, you will need to create custom categories to suit your needs.

2. **Create Filters:**
   - To streamline categorization, create filters that apply automatically during future imports.
   - Using filters saves time by ensuring transactions are categorized consistently with minimal effort.

By following this workflow, you can efficiently manage and analyze your financial data, keeping it organized and aligned with your personal goals.

## Development environment

### Vs Code

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### MySql Server

Use _sqlserver.sh_ script, located in the _system_ directory, which uses the _docker-compose.yml_ file, to create a local mysql database.

### Backup / Restore

This application relies in the _mysqldump_ application to restore the database.  
Make sure _mysqldump_ is installed and accessible by _$PATH_.

### Deployment

The _/system/docker_ directory contains the files needed to set up the production environment using docker.

At the time of writting you need to install _docker.io_, _docker-compose-v2_ & _docker-buildx_ packages (who knows how it will be next week).

#### docker-setup.sh

This tool will help you in building the docker images of the server and the client components, either to use them locally or pushing them to dockerhub and install the application somewhere else.

Just type `$ ./docker-setup.sh` to get the help message.

**buildx error message**
The following message may arise when you build the docker files:

```
ERROR: Multi-platform build is not supported for the docker driver.
Switch to a different driver, or turn on the containerd image store, and try again.
```

in this case run the follonwing commands:

```
docker buildx create --name multiarch-builder --driver docker-container
docker buildx inspect --bootstrap
```

## Production environment

In your production environment

- Install docker with _docker-compose-plugin_
- Copy the _docker-compose.yml_ file to a directory of your choice.
- Create a _.env_ file in the same directory and add:

```
MYSQL_ROOT_PASSWORD=secret_mysql
DB_HOST=mysql_server_address *
DB_NAME=database_name
DB_USER=user_name
DB_PASSWORD=user_password
SECRET_ID=secret_id
SECRET_KEY=secret_key
```

- where 'secret_mysql' is the password you choose for the database root user
- 'database_name', 'user_name' and 'user_password' are... well, I guess you'll kown
- and 'secret_id' and 'secret_key' are your [GoCardless](#gocardless) secret id and key

\* if you want to use Mysql Docker set 127.0.0.1 to DB_HOST. localhost won't work because of default mysql binding.

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
journalctl -u wmm.service -p debug -xe
```

### System update

To update the docker images in the production system, run the following commands

```
sudo docker pull <docker-username>/wmm-client
sudo docker pull <docker-username>/wmm-server
sudo systemctl restart wmm
```

### GoCardless

With this integration, transactions are retrieved directly from the bank. This indeed eliminates the "Duplicates problem" and obsoletes the CSV Import method.

CSV Import is still maintained in case the GoCardless solution is not an option.

Go to [GoCardless](https://bankaccountdata.gocardless.com/login) sign-in/sign-up and create your keys to operate with GoCardless and be able to import the transactions directly from your bank.

## User Guide

When your bank is not supported by **GoCardless** there is an alternative. Most banks provide a way to download your transactions locally. If this is possible, you can download a CSV file or another type of Excel file. If you can only obtain an Excel file, you can convert it using LibreOffice to CSV, although this may make using the application more tedious.

In the **_Categorize_** view. Click the **_Zoom_** button with the _description_ and _category_ fields left blank to find uncategorized transactions. Use the _description_ filter field to locate specific transactions. The \_category' filter field can be used to re-categorize transactions as needed.

After selecting multiple transactions, choose an existing category or type a new one, then click the **_Apply_** button to assign the selected (or newly typed) category to the chosen transactions.

A more efficient way to categorize is by using filters. Select a single transaction and click on the **_Create New Filter_** button. A dialog box will appear where you can configure the new filter with three fields: the **Category**, which is the category to be assigned to transactions matching the filter, a **Filter** (a part or full description of the transaction), and an optional **Label** for easy identification. Once created, the filter can be applied to all matching transactions.

After setting up filters, the **_Apply All Filters_** button will be useful for categorizing new transactions based on existing filters.

In the **_Filters_** view, you can manage categories and filters—renaming, deleting, or adding new ones.

The **_SQL Commands_** view provides an open window to the database, allowing you to query as needed.

Use the **_Browse_** submenu options to view your data as transactions, categories, or in a timeline.

## Legacy

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
