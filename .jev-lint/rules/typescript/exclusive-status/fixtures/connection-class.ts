class Connection {
  connected = false;
  connecting = false;
  failed = false;

  open(): void {
    this.connecting = true;
  }

  opened(): void {
    this.connected = true;
  }

  broke(): void {
    this.failed = true;
  }
}

export { Connection };
