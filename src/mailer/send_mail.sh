#!/bin/bash
echo "mail.sh: creating new ./temp_mail.txt with unsent positions"
cp ./mail_template.txt ./temp_mail.txt

while IFS= read -r line; do
    echo "$line" >> ./temp_mail.txt
done

email=$1;

sendmail $email < ./temp_mail.txt;
rm ./temp_mail.txt;
