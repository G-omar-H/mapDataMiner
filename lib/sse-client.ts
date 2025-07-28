import { SearchParams, ScrapingProgress, BusinessData } from '@/types';

interface SSEProgressEvent {
  type: 'progress';
  status: string;
  currentStep: string;
  progress: number;
  totalFound: number;
  scraped: number;
  errors: string[];
}

interface SSECompleteEvent {
  type: 'complete';
  success: true;
  businesses: BusinessData[];
  count: number;
  searchParams: SearchParams;
  warnings?: string[];
}

interface SSEErrorEvent {
  type: 'error';
  error: string;
  message: string;
}

export type SSEEvent = SSEProgressEvent | SSECompleteEvent | SSEErrorEvent;

export class SSEScrapingClient {
  private abortController: AbortController | null = null;

  async startScraping(
    params: SearchParams,
    onProgress: (progress: ScrapingProgress) => void,
    onComplete: (businesses: BusinessData[], warnings?: string[]) => void,
    onError: (error: string, message: string) => void
  ) {
    // Abort any existing request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(params),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        // Handle non-streaming error responses
        const errorData = await response.json();
        onError(
          errorData.error || 'Request failed',
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        onError('Stream Error', 'Unable to read response stream');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData: SSEEvent = JSON.parse(line.slice(6));
                
                switch (eventData.type) {
                  case 'progress':
                    onProgress({
                      status: eventData.status as any,
                      currentStep: eventData.currentStep,
                      progress: eventData.progress,
                      totalFound: eventData.totalFound,
                      scraped: eventData.scraped,
                      errors: eventData.errors,
                    });
                    break;
                    
                  case 'complete':
                    onComplete(eventData.businesses, eventData.warnings);
                    break;
                    
                  case 'error':
                    onError(eventData.error, eventData.message);
                    break;
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError, 'Raw data:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      // Handle network errors and aborted requests
      if (error.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      }
      
      onError(
        'Network Error',
        error.message || 'Failed to connect to server'
      );
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
} 