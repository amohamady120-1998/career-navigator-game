import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import atharLogoLight from "@/assets/athar-logo-light.png";
import { logError } from "@/lib/analytics";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
    logError(error.message, {
      stack: error.stack,
      route: window.location.pathname,
      meta: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
          <div className="text-center space-y-6 max-w-md">
            <img src={atharLogoLight} alt="أثر البداية" className="h-16 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
            <p className="text-muted-foreground">نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>
            <p className="text-xs text-muted-foreground/60 font-mono">{this.state.errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
              <Button variant="outline" onClick={() => { this.setState({ hasError: false }); window.location.href = "/dashboard"; }}>
                العودة للرئيسية
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
