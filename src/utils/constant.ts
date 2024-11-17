export const ObjectId = {
  Username: "#email-sign-in",
  Password: "#password-sign-in",
  LoginButton: ".StyledButtonKind-sc-1vhfpnt-0",
  InputSerialNr: "input[type=\"text\"]",
  ButtonSerialNr: "button.slds-button_brand",
  MultiProductModal: ".slds-modal__container",
  MultiModalCancelBtn: 'button.slds-button:has-text("Cancel")',
  SerialNrLabel: 'h5.serialNumber-label',
  ProductNrValue: "div.productNumber-value",
  ProductNameValue: "div.description-value",
  TBodyValue: "tbody",
  CheckAnotherBtn: 'button.slds-button:has-text("Check Another Product")',
  NoDataFound: 'div.slds-form-element__help:has-text("No data found. Please try another serial number.")'

  // SubTitleTxt: 'div.slds-grid[data-id="subtitle"]:has-text("See product warranty and support status below.")'
}

export enum TableIndex {
  Type,
  ServiceType,
  StartDate,
  EndDate,
  ServiceLevel,
  deliverables,
  Status,
}