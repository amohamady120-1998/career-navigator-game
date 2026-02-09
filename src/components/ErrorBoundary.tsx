import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import atharLogoLight from "@/assets/athar-logo-light.png";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
          <div className="text-center space-y-6 max-w-md">
            <img src={atharLogoLight} alt="أثر البداية" className="h-16 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
            <p className="text-muted-foreground">نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>
            <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
