import axios from "axios";
import Butter from "buttercms";
import Airtable from "airtable";

class Api {
  /**
   * Create our instance of the api class.
   */
  constructor(config = {}) {
    this.axios = axios.create({
      timeout: 15000, // 15 seconds
    });
    this.butter = Butter(config.butterKey);
    this.config = config;

    Airtable.configure({
      endpointUrl: "https://api.airtable.com",
      apiKey: this.config.airtableKey,
    });
    this.airtable = Airtable.base("applbJgB5JNe73ode"); // beCamp 2024
  }

  /**
   * Bind in the context of our current instance.
   */
  addContext(context) {
    this.context = context;
    return this;
  }
}

export default function (config = {}) {
  return new Api(config);
}
