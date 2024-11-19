export const ObjectId = {
  Username: "#email-sign-in",
  Password: "#password-sign-in",
  LoginButton: ".StyledButtonKind-sc-1vhfpnt-0",
  InputSerialNr: 'input[type="text"]',
  ButtonSerialNr: "button.slds-button_brand",
  MultiProductModal: ".slds-modal__container",
  MultiModalCancelBtn: 'button.slds-button:has-text("Cancel")',
  SerialNrLabel: "h5.serialNumber-label",
  ProductNrValue: "div.productNumber-value",
  ProductNameValue: "div.description-value",
  TBodyValue: "tbody",
  CheckAnotherBtn: 'button.slds-button:has-text("Check Another Product")',
  NoDataFound:
    'div.slds-form-element__help:has-text("No data found. Please try another serial number.")',

  // SubTitleTxt: 'div.slds-grid[data-id="subtitle"]:has-text("See product warranty and support status below.")'
};

export enum TableIndex {
  Type,
  ServiceType,
  StartDate,
  EndDate,
  ServiceLevel,
  deliverables,
  Status,
}

export const Messages = {
  PageNotInitialized: "Page is not initialized",
  StateIsValid: "State is valid, ready to proceed.",
  RedirectedToLoginPage: "Redirected to login page. Initiating login...",
  NavigatedToURL: "Navigated to URL:",
  LoginFailed: "Login failed: ",
  StartingScrape: "Starting data scraping for serial number:",
  ModalAppeared: "Modal appeared, requiring additional input",
  NeedModelNumber: "Need model number",
  NoDataFound: "No data found for the serial number",
  NotFound: "Not found",
  SerialNumberFound: "Serial number found, extracting details.",
  ErrorDataScraping: "Error during data scraping:",
  ServerResTimeoutExceeded: "Server response timeout exceeded",
  ServerError: "HPE Server Error, try again later",
};
