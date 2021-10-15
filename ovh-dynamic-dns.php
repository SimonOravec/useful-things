<?php
$cachefile = __DIR__.'/cache.txt';
$check_url = 'http://whatismyip.akamai.com';

$ip = file_get_contents($check_url);
if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) != $ip) {
    die;
}

if (file_exists($cachefile)) {
    $last_ip = file_get_contents($cachefile);
    if ($last_ip != $ip) {
        updateIP();
    }
} else {
    updateIP();
}

function updateIP() {
    file_put_contents($cachefile, $ip);
    
    $context = stream_context_create(['http' => ['header' => 'Authorization: Basic #####']]);
    file_get_contents('https://www.ovh.com/nic/update?system=dyndns&hostname=#dyndns.example.com#&myip='.$ip, false, $context);
}
?>
