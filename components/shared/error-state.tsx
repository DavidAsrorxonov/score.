import * as React from "react";
import { AlertCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export interface ErrorStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      {description ? <AlertDescription>{description}</AlertDescription> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </Alert>
  );
}
