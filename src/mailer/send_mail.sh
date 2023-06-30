#!/bin/bash
echo "mail.sh: creating new ./temp_mail.txt with unsent positions"
scriptdir=$(dirname "$0")
echo "scriptdir: "$scriptdir
cp $scriptdir/mail_template.txt $scriptdir/temp_mail.txt

while IFS= read -r line; do
    echo "$line" >> $scriptdir/temp_mail.txt
done

email=$1;

sendmail $email < $scriptdir/temp_mail.txt;
rm $scriptdir/temp_mail.txt;
