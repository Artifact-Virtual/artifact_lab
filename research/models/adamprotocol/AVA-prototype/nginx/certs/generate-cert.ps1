# Generate self-signed certificate for AVA development
$cert = New-SelfSignedCertificate -DnsName "ava.local", "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1)
$password = ConvertTo-SecureString -String "ava_dev_cert" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "cert.pfx" -Password $password
