#!/bin/bash

#THIS SCRIPT REQUIRES 'wget' and 'ipset' installed (Tested on GNU Wget 1.21.3 & ipset v7.17, protocol version: 7)

#Root user check
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

#Create or flush sets
ipset -L blacklist >/dev/null 2>&1
if [ $? -ne 0 ]; then
   ipset create blacklist hash:net family inet hashsize 16384 maxelem 65536
else
   ipset flush blacklist
fi

#Update sets
COUNTRIES=('cn' 'ru' 'by' 'in')

for i in "${COUNTRIES[@]}"; do
 for IP in $(wget --no-check-certificate -q -O - https://www.ipdeny.com/ipblocks/data/countries/${i}.zone)
 do
  ipset add "blacklist" $IP
 done
done

#Save sets
mkdir -p /etc/ipset
ipset save > /etc/ipset/rules
