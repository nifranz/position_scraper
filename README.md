# Web Scraper for instinct3 job offers

## Description

This projects implements a web scraper application, periodically searching the instinct3 website for open job positions, saving them to a sqlite database and sending a notification email to a specified e-mail adress whenever new positions are being posted.

## Dependencies

- node
- node packages: axios, cheerio, sqlite 3
- linux mailer daemon: sendmail

## Architecture

The service is implemented using multiple sub-services: a scraper-service and a mailer-service. They are periodically called on a linux server using cron jobs.

### Scraper Service
- src/scraper.js
This sub-service scrapes the instinct 3 career site for any job position entries existing on the site, using the package axios to get the HTML contents and the package cheerio to extract the desired data from the HTML elements. It then looks for existing entries in the database matching the extracted job offers. For any new entries that are not present in the database, a new database-entry is created with the job title and a last_seen attribute using the current date-time. There is a email_sent attribute present in the database which defaults to 0 when the entry is created.
The "last_seen" attribute of any existing entries are updated with the current date-time.

### Mail Service
- src/mailer.js
- src/mailer.sh
This sub-service retrieves all present position entries in the database, filtering for any entry for which the email_sent attribute corresponds to 0. This ensures that only those positions are taken into account for which no email has been sent in the past. The entries collected this way are passed to a shell script mailer.sh, using the command exec from the node standard library. The positions, which are cast into a continous string, are passed to the script via stdin.

 Thek shell script copies the mail_template.txt-file into a temp_mail.txt-file and all entries passed to the script, which are being read from stdin, are appended to this file. Using the linux "sendmail" command, an email with the contents of the temp_mail.txt-file is being sent to the specified email.

 After the shell script is successfully executed, the mailer.js script updates all unsent position-entries in the database by updating the "sent_mail" attribute of each entry to 1.