/**
 * Selah Turnstile & Automated Gate Access Controller
 * Supports:
 * 1. Web Serial API (USB Relay Modules: CH340, FTDI, CP2102)
 * 2. Network IP Relay Webhooks (Ethernet/Wi-Fi Controllers)
 * 3. Web Audio API Acoustic Feedback (Gate Chimes & Denial Buzzers)
 */

export type TurnstileConfig = {
  gateName: string;
  pulseDurationMs: number;
  ipRelayUrl?: string;
  soundEnabled: boolean;
};

export class TurnstileRelayController {
  private serialPort: any | null = null;
  private writer: any | null = null;
  private isConnecting = false;
  private audioCtx: AudioContext | null = null;

  /** Checks if the browser supports the Web Serial API */
  public isWebSerialSupported(): boolean {
    return typeof window !== "undefined" && "serial" in navigator;
  }

  /** Connect to a USB Relay device via the Web Serial API */
  public async connectUsbRelay(): Promise<{ success: boolean; error?: string }> {
    if (!this.isWebSerialSupported()) {
      return { success: false, error: "Web Serial is not supported in this browser. Use Chrome, Edge, or Opera." };
    }

    if (this.isConnecting) return { success: false, error: "Connection in progress" };
    this.isConnecting = true;

    try {
      // Prompt user to select their USB Relay module
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 9600 });
      this.writer = this.serialPort.writable.getWriter();
      return { success: true };
    } catch (err: any) {
      if (err.name === "NotFoundError") {
        return { success: false, error: "No device selected." };
      }
      return { success: false, error: err.message || "Failed to open USB relay port" };
    } finally {
      this.isConnecting = false;
    }
  }

  /** Disconnect the active USB relay */
  public async disconnectUsbRelay(): Promise<void> {
    try {
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
      if (this.serialPort) {
        await this.serialPort.close();
        this.serialPort = null;
      }
    } catch (e) {
      console.warn("[turnstile] Error disconnecting relay:", e);
    }
  }

  public isConnected(): boolean {
    return Boolean(this.serialPort && this.writer);
  }

  /**
   * Pulses the physical relay open for a positive scan.
   * Standard LCUS-1 / CH340 Relay Commands:
   * Open:  0xA0 0x01 0x01 0xA2
   * Close: 0xA0 0x01 0x00 0xA1
   */
  public async pulseGateOpen(config: TurnstileConfig): Promise<{ hardwareTriggered: boolean }> {
    let triggered = false;

    // 1. Play pleasant acoustic unlock chime
    if (config.soundEnabled) {
      this.playChime("unlocked");
    }

    // 2. Trigger USB Relay if connected
    if (this.writer) {
      try {
        // Send OPEN relay command
        const openCmd = new Uint8Array([0xA0, 0x01, 0x01, 0xA2]);
        await this.writer.write(openCmd);
        triggered = true;

        // Schedule CLOSE command after the pulse duration
        setTimeout(async () => {
          try {
            if (this.writer) {
              const closeCmd = new Uint8Array([0xA0, 0x01, 0x00, 0xA1]);
              await this.writer.write(closeCmd);
            }
          } catch (err) {
            console.error("[turnstile] Error resetting relay:", err);
          }
        }, config.pulseDurationMs);
      } catch (err) {
        console.error("[turnstile] USB relay write failed:", err);
      }
    }

    // 3. Trigger Network IP Relay if URL is configured
    if (config.ipRelayUrl && config.ipRelayUrl.trim()) {
      try {
        fetch(config.ipRelayUrl.trim(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "open", duration: config.pulseDurationMs }),
          mode: "no-cors",
        }).catch((e) => console.warn("[turnstile] IP relay trigger note:", e));
        triggered = true;
      } catch (err) {
        console.warn("[turnstile] IP relay error:", err);
      }
    }

    return { hardwareTriggered: triggered };
  }

  /**
   * Sound alarm and keep turnstile firmly locked for a negative/duplicate scan
   */
  public triggerAccessDenied(config: TurnstileConfig): void {
    if (config.soundEnabled) {
      this.playChime("denied");
    }
    // We intentionally DO NOT send any relay signal, keeping the turnstile locked.
  }

  /** Synthesizes audio feedback via Web Audio API */
  private playChime(type: "unlocked" | "denied") {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === "suspended") {
        this.audioCtx = new AudioCtxClass();
      }
      const ctx = this.audioCtx;

      if (type === "unlocked") {
        // High harmonic double-bell chime
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.setValueAtTime(1318.5, now + 0.1); // E6

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1760, now + 0.1); // A6 harmonic

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.1);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
      } else {
        // Low access-denied harsh buzz
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(140, now + 0.15);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
      }
    } catch (e) {
      console.warn("[turnstile] Audio synthesis notice:", e);
    }
  }
}

// Global singleton instance for application sessions
export const turnstileRelay = new TurnstileRelayController();
