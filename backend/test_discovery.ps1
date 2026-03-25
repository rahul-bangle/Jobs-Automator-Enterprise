# Force list representation for PowerShell
$body = '[ "hyderabad" ]'

# Query and Limit in the URL
$url = "http://127.0.0.1:8001/api/v1/v2/jobs/discovery?query=assistant+product+manager&limit=2"

$response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 10
