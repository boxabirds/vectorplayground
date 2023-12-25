const JSDOMEnvironment = require('jest-environment-jsdom');

class CustomTestEnvironment extends JSDOMEnvironment {
  constructor(config) {
    super(config);
  }

  setup() {
    return super.setup().then(() => {
      if (this.global.jsdom) {
        this.global.HTMLElement = this.global.window.HTMLElement;
      }
    });
  }
}

module.exports = CustomTestEnvironment;
