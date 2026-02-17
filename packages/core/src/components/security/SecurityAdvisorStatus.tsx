import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card"
import { Badge } from "@complianceos/ui/ui/badge"

export default function SecurityAdvisorStatus() {
  const ready = true
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Copilot</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant={ready ? "default" : "secondary"}>
          {ready ? "Ready" : "Not Configured"}
        </Badge>
      </CardContent>
    </Card>
  )
}
