$pluginPath = 'C:\Users\anshe\Downloads\ProjectManager-main\ProjectManager-main\tools\session-manager-plugin\package\bin'
$env:PATH = "$pluginPath;$env:PATH"

Import-Module AWS.Tools.SimpleSystemsManagement

Start-SSMSession `
  -Target 'i-0de0d9f3c21a6389e' `
  -DocumentName 'AWS-StartPortForwardingSessionToRemoteHost' `
  -Parameter @{
    host = 'projectmanager-dev-postgres.cijkoigmw8ht.us-east-1.rds.amazonaws.com'
    portNumber = '5432'
    localPortNumber = '5432'
  } `
  -Region 'us-east-1'
