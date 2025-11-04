import React from 'react';
import { View, Text, Button, DevSettings } from 'react-native';

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    try {
      // Reload in dev; in production this is a no-op unless using Updates
      DevSettings.reload();
    } catch {
      this.setState({ hasError: false, error: undefined });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ color: '#666', textAlign: 'center', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <Button title="Reload app" onPress={this.handleReload} />
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
