/**
 * Singleton class to manage the Web Audio API context and analyzer
 */
class AudioContextManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  
  /**
   * Get or create the audio context
   */
  getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }
  
  /**
   * Get or create the analyzer node
   */
  getAnalyser(): AnalyserNode {
    if (!this.analyser) {
      const ctx = this.getAudioContext();
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      // Optimal settings for pitch detection
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -100;
      this.analyser.maxDecibels = -10;
    }
    return this.analyser;
  }
  
  /**
   * Close and clean up the audio context
   */
  closeAudioContext(): Promise<void> {
    if (this.audioContext) {
      return this.audioContext.close().then(() => {
        this.audioContext = null;
        this.analyser = null;
      });
    }
    return Promise.resolve();
  }
}

// Create a singleton instance
const AudioContext = new AudioContextManager();
export default AudioContext;