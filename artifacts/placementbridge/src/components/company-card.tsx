import { Link } from "wouter";
import { Company } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Globe, CheckCircle2 } from "lucide-react";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Card className="hover:shadow-md transition-all duration-300 border-border/50 group h-full flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <div className="w-16 h-16 rounded-xl overflow-hidden border bg-muted flex-shrink-0 flex items-center justify-center">
          {company.logo ? (
            <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
          ) : (
            <Building className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-1">{company.name}</h3>
            {company.isVerified && (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            {company.industry && (
              <Badge variant="outline" className="font-normal mr-2">
                {company.industry}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-2">
        {company.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {company.description}
          </p>
        )}
        <div className="space-y-2 mt-auto text-sm text-muted-foreground">
          {company.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary/70" />
              {company.location}
            </div>
          )}
          {company.website && (
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2 text-primary/70" />
              <a href={company.website} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline truncate">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
