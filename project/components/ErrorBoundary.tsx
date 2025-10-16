import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, you might want to log this to a crash reporting service
    // like Sentry, Bugsnag, etc.
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReportError = () => {
    const errorMessage = this.state.error?.message || 'Bilinmeyen hata';
    const errorStack = this.state.error?.stack || 'Stack trace mevcut değil';
    
    Alert.alert(
      'Hata Raporu',
      `Hata: ${errorMessage}\n\nBu hatayı geliştirici ekibine bildirmek ister misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Bildir', 
          onPress: () => {
            // Here you would typically send the error to your error reporting service
            console.log('Error reported:', { errorMessage, errorStack });
            Alert.alert('Teşekkürler', 'Hata raporu gönderildi.');
          }
        }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <AlertTriangle size={64} color="#EF4444" />
            <Text style={styles.title}>Bir Hata Oluştu</Text>
            <Text style={styles.message}>
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Hata Detayları (Geliştirici Modu):</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.retryButton]} 
                onPress={this.handleRetry}
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Tekrar Dene</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.reportButton]} 
                onPress={this.handleReportError}
              >
                <Text style={[styles.buttonText, styles.reportButtonText]}>Hata Bildir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  debugContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#7F1D1D',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#EF4444',
  },
  reportButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportButtonText: {
    color: '#6B7280',
  },
});

export default ErrorBoundary;






