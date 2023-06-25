#!/bin/bash
echo "mail.sh: creating new ./temp_mail.txt with unsent positions"
cp ./mail_template.txt ./temp_mail.txt
while IFS= read -r line; do
    echo "$line" >> ./temp_mail.txt
done

# positions=$1
# echo positions | mail -s "Test" niklas.franz@icloud.com