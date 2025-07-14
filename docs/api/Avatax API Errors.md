1	ServerConfiguration	Indicates that there is a server configuration problem with one of the servers in Avalara's AvaTax cluster.
2	AccountInvalidException	You attempted to read information about an account that does not exist.
3	CompanyInvalidException	You attempted to modify a company that does not exist.
4	EntityNotFoundError	You attempted to act on, retrieve, update, or delete an object that does not exist.
5	ValueRequiredError	You submitted a request and did not provide a value in a required field.
6	RangeError	You attempted to set a value that must be within a range, but your value was outside of the range.
7	RangeCompareError	You specified an out-of-bounds field value.
8	RangeSetError	You attempted to set a value that was not permitted.
9	TaxpayerNumberRequired	Customers subscribing to Avalara Returns must identify each company by its United States Taxpayer ID Number (TIN).
10	EntityLimitExceeded	The number of entities in the request exceeded the limit.
11	CommonPassword	The password you have chosen is a commonly-guessed password and cannot be used.
12	WeakPassword	The password you specified does not meet minimum complexity requirements.
13	StringLengthError	One of the strings you uploaded to the server is too long and cannot be saved.
14	MaxStringLengthError	The string you provided was too long for the field.
15	EmailValidationError	You attempted to provide an email address that does not conform to email address standards.
16	EmailMissingError	You must provide an email address with this request.
17	InvalidQueryField	A field in the query was not found.
18	InvalidQueryValue	The value provided for a query field is invalid.
19	SyntaxError	The filter parameter has a syntax error.
20	TooManyParametersError	The filter parameter has too many values.
21	UnterminatedValueError	A filter value was not properly terminated.
22	DeleteUserSelfError	A user account may not call DELETE on the user itself.
23	OldPasswordInvalid	You attempted to reset a password but you did not provide a correct old password value.
24	CannotChangePassword	You attempted to change passwords for a user who is not permitted to change their password.
25	ReadOnly	The field is read-only.
26	DateFormatError	The date value you provided was incorrectly formatted.
27	NoDefaultCompany	Your account does not currently have a default company.
28	AccountTypeNotSupported	This account type cannot perform this operation.
30	AuthenticationException	The credentials you provided to AvaTax could not be validated.
31	AuthorizationException	Your account is not authorized to call this API.
32	ValidationException	Your API call contained an incorrectly structured object.
33	InactiveUserError	This user account is currently inactive.
34	AuthenticationIncomplete	Your API call did not contain authentication information.
35	BasicAuthIncorrect	Your Basic authorization header was not encoded correctly.
36	IdentityServerError	A problem was detected with Avalara Identity.
37	BearerTokenInvalid	The Bearer Token that you used for authentication was not valid.
38	ModelRequiredException	You called an API that requires an object, but you did not provide an object.
39	AccountExpiredException	Your AvaTax account has expired, or is not yet enabled. You may need to contact your customer account manager for assistance.
41	BearerTokenNotSupported	Bearer Token authentication is not yet supported with this API.
42	InvalidSecurityRole	You do not have permission to create or update users with this security role.
43	InvalidRegistrarAction	The action you attempted is restricted.
44	RemoteServerError	A remote server AvaTax depends on is not working.
45	NoFilterCriteriaException	You provided a filter with your query, but did not specify any criteria.
46	OpenClauseException	Your $filter value has a mismatched open parenthesis / close parenthesis.
47	JsonFormatError	The JSON you sent with your request was invalid.
48	InvalidDecimalValue	A field in your request has too many decimal places or too many digits over all.
49	PermissionRequired	User doesn't have permission for action.
50	UnhandledException	The API you attempted to call resulted in an unhandled exception within Avalara AvaTax.
51	InactiveAccount	The account is currently inactive.
52	LinkageNotAllowed	The client account cannot be linked to the firm.
53	LinkageStatusUpdateNotSupported	The status cannot be updated.
60	ReportingCompanyMustHaveContactsError	A company that is designated to report taxes must have at least one designated contact person.
61	CompanyProfileNotSet	This error occurs when you try to modify the tax profile of a company that inherits its tax profile from its parent.
62	CannotAssignUserToCompany	Only Company-level users may be assigned to a company.
63	MustAssignUserToCompany	Company level users must be assigned to a company within this account.
64	InvalidTaxTypeMapping	The tax type mapping provided is not valid.
70	ModelStateInvalid	You provided an incorrectly structured object to AvaTax.
80	DateRangeError	This error occurs when you create an object whose end date is before its effective date.
81	InvalidDateRangeError	You specified a date outside of the allowable range.
82	RuleMustHaveTaxCode	A tax rule with type ProductTaxabilityRule cannot have a null tax code or be assigned to all tax codes.
83	RuleTypeRestricted	You attempted to use a restricted tax rule type.
85	InvalidCompanyLocationSetting	You used a company location that does not exist.
99	InvalidAdjustmentType	The adjustment type record permits only a specified list of values.
100	DeleteInformation	This message represents information provided about an object that was deleted.
118	OutOfRange	You attempted to set a value that must be within a range, but your value was outside of the range.
119	UnspecifiedTimeZone	You specified a date/time value without a timezone.
120	CannotCreateDeletedObjects	You may not create an object with a "Deleted" flag.
121	CannotModifyDeletedObjects	If an object has been deleted, you may not modify it further after its deletion.
122	ReturnNameNotFound	You attempted to create a filing calendar for a return that is not recognized by AvaTax.
123	InvalidAddressTypeAndCategory	When creating a location, you must specify a compatible AddressType and AddressCategory value.
124	DefaultCompanyLocation	The default location for a company must be a physical-type location rather than a salesperson-type location.
125	InvalidCountry	The country code you provided is not recognized as a valid ISO 3166 country code.
126	InvalidCountryRegion	You specified a country/region that was not recognized by the ISO 3166 country/region code system.
127	BrazilValidationError	Reserved for future use.
128	BrazilExemptValidationError	Reserved for future use.
129	BrazilPisCofinsError	Reserved for future use.
130	JurisdictionNotFoundError	The specified jurisdiction could not be found.
131	MedicalExciseError	You attempted to create a tax rule that designated a device as medical excise tax for an incorrect jurisdiction.
132	RateDependsTaxabilityError	You created a tax rule with a RateDepends option, but that rule is not a TaxabilityRule.
134	InvalidRateTypeCode	This rate type is not valid in the country provided.
135	RateTypeNotSupported	You attempted to choose a rate type that is not supported for the country you selected.
136	CannotUpdateNestedObjects	In AvaTax REST, you can create objects with nested children, but you cannot update objects with nested children.
137	UPCCodeInvalidChars	Your UPC code contains invalid characters.
138	UPCCodeInvalidLength	Your UPC code was too long to fit into the standard UPC object field.
139	IncorrectPathError	You attempted to modify an object but you provided an object that matches a different URL.
140	InvalidJurisdictionType	You specified a jurisdiction type that is not recognized.
141	MustConfirmResetLicenseKey	When resetting a license key for your account, you must provide a flag that indicates that you really want to reset your license key.
142	DuplicateCompanyCode	You cannot create two companies with the same company code.
143	TINFormatError	The U.S. Taxpayer Identification Number you provided is not in a recognized format.
144	DuplicateNexusError	Nexus is a concept used to declare that your business is subject to taxation by a particular jurisdiction; you may not declare any one jurisdiction more than once.
145	UnknownNexusError	You attempted to declare nexus in a jurisdiction that is not recognized by AvaTax.
146	ParentNexusNotFound	You attempted to create a nexus in a tax authority that is underneath a parent tax authority, but you have not yet declared nexus with the parent tax authority.
147	InvalidTaxCodeType	You specified a tax code type that is not recognized by Avalara.
148	CannotActivateCompany	A company can only be activated when it has a valid tax profile.
149	DuplicateEntityProperty	You attempted to create an object with a duplicate name or code.
150	ReportingEntityError	You attempted to use a Returns API on a company not designated to file returns.
151	InvalidReturnOperationError	You attempted to modify a tax filing return that has been approved.
152	CannotDeleteCompany	You attempted to delete a company with committed transactions.
153	CountryOverridesNotAvailable	The jurisdiction override feature is only available in the United States.
154	JurisdictionOverrideMismatch	An address override cannot be created for this jurisdiction.
155	DuplicateSystemTaxCode	You attempted to create a duplicate TaxCode object.
157	NexusDateMismatch	You declared nexus on a date when that nexus was not available.
159	NexusParentDateMismatch	You declared nexus on a date when that nexus was not available.
160	BearerTokenParseUserIdError	The bearer token you provided could not be parsed.
161	RetrieveUserError	Your bearer token does not have a provisioned AvaTax account.
162	InvalidConfigurationSetting	The configuration setting you specified is invalid.
163	InvalidConfigurationValue	The configuration value you supplied was invalid.
164	InvalidEnumValue	You specified an invalid value for a field.
165	TaxCodeAssociatedTaxRule	This tax code cannot be deleted because it is in use.
166	CannotSwitchAccountId	You may not change the accountId value on a company.
167	RequestIncomplete	Your API request contained unprintable characters or was incomplete.
168	AccountNotNew	Only accounts in 'New' status may be activated.
169	PasswordLengthInvalid	Your password did not meet length requirements.
170	InvalidPageKey	The page key is invalid.
171	InvalidEcmsOverrideCode	The EcmsOverrideCode value you supplied conflicts with a system-defined code.
172	AccountDoesNotExist	You attempted to modify an account that does not exist.
173	InvalidTaxType	You specified a tax type that does not exist.
174	IncorrectFieldValue	You attempted to call the Reporting API with an incorrect field value.
175	LeadingOrTrailingException	The value you provided in the `$filter` parameter was incorrect.
176	NotEnoughAddressesInfo	A tax transaction must have both an origin and a destination address.
177	ReportNotInitiated	This report has not yet been created.
178	FailedToBuildReport	The report request you submitted could not be processed.
179	ReportNotFinished	This report is not yet completed.
181	FailedToDownloadReport	A server error prevented the report file from being downloaded.
182	MalformedFilterException	The `$filter` parameter could not be parsed.
183	ExpectedConjunctionError	The `$filter` criteria in your API request was missing a conjunction.
184	CriteriaNotSupportedError	Your `$filter` parameter contains criteria that are not supported.
185	CompanyAccountAndParentAccountMismatch	This operation is not permitted in technical support.
186	InvalidFileContentType	The file content type could not be determined correctly.
187	RequestTooLarge	The request you submitted was too large to process.
188	EcmsDisabled	The ECMS configuration value for this account does not permit exemption certificates.
189	UnknownConjunctionError	You attempted to use an invalid conjunction in your filter.
190	NoLinesDiscounted	You attempted to specify a discount, but did not identify any lines to discount.
191	FailedToDelete	You attempted to delete an object that was in use.
192	CircularCompanyHierarchies	Creating this company as submitted would result in a circular hierarchical reference.
193	DuplicateEntry	The key or name already exists.
194	DuplicateFieldNameInOrderBy	A sort or order filter criteria for this request was repeated.
195	CannotAdjustDocumentType	The document type is an immutable property.
196	UserNoAccess	This user has a security role that blocks usage of this service.
197	InvalidEntry	Invalid entry.
198	TransactionAlreadyCancelled	The transaction has already been cancelled
199	QueryParameterOutOfRange	The query parameter is out of range.
200	BatchSalesAuditMustBeZippedError	Sales audit files must be uploaded in ZIP or RAR formats.
201	BatchZipMustContainOneFileError	Compressed files uploaded to the Batch service must contain exactly one file.
202	BatchInvalidFileTypeError	You uploaded a batch file with an incorrect file type.
203	BatchCannotSaveBatchFile	AvaTax cannot save the batch file.
204	BatchCannotGetBatchFile	Batch file could not be found.
205	BatchCannotDeleteBatchFile	Batch file deletion is not allowed.
206	BatchMustContainOneFile	This batch object must contain only one file.
207	MissingBatchFileContent	The batch object must contain a file to be processed.
208	BatchCannotBeDeletedWhileProcessing	Cannot delete batch while processing.
209	InternalServerError	A remote server responded with an InternalServerError.
250	PointOfSaleFileSize	The Point-Of-Sale API cannot build this file dynamically.
251	PointOfSaleSetup	Invalid parameter provided in the Point-Of-Sale file request.
252	InvalidInputDate	You attempted to set a date value that must be within a range, but your value was outside of the range.
300	GetTaxError	A problem occurred when you attempted to create a transaction through AvaTax.
301	AddressConflictException	You attempted to add multiple addresses to a transaction that was flagged as a single-address transaction.
303	DocumentCodeConflict	You attempted to create a document with a code that matches an existing transaction.
304	MissingAddress	When creating transactions, you must at a minimum provide an origin and destination address.
306	InvalidParameterValue	When adding parameters to your CreateTransactionModel, you must specify a parameter of the correct type.
308	FetchLimit	Too many records requested.
309	InvalidAddress	The address you provided was incomplete.
310	AddressLocationNotFound	The specified location code does not exist.
311	MissingLine	You attempted to create a tax transaction with no lines.
312	InvalidAddressTextCase	You provided an invalid parameter to the address resolution endpoint.
313	DocumentNotCommitted	You attempted to lock a transaction (aka Document) that was not committed.
315	InvalidDocumentTypesToFetch	Temporary documents cannot be fetched from the API.
316	TimeoutRequested	You requested a timeout error from the AvaTax API.
317	InvalidPostalCode	The postal code you provided could not be found.
318	InvalidSubscriptionDescription	Subscription description cannot be None when subscriptionTypeId is not provided
319	InvalidSubscriptionTypeId	Invalid subscription TypeId.
401	CannotChangeFilingStatus	The requested filing status change is invalid.
402	FEINFormatError	Federal Employer Identification Number (FEIN) is not in the correct format.
500	ServerUnreachable	One of the servers in the Avalara AvaTax API cluster is unreachable and your API call could not be completed.
600	SubscriptionRequired	This Avalara API call requires an active subscription to a specific service.
601	AccountExists	An account tied to this email address already exists.
602	InvitationOnly	You attempted to contact an API that is available by invitation only.
606	FreeTrialNotAvailable	The Free Trial API is not available on this server.
607	AccountExistsDifferentEmail	An account with this username already exists.
608	AvalaraIdentityApiError	A server configuration problem has been detected.
609	InvalidIPAddress	Your IP address has not been approved.
610	OfferCodeAlreadyApplied	The offer code has already been applied to this account.
611	AccountAlreadyExists	This combination of the account name and company address already exists.
612	LicenseKeyNameAlreadyExistsForAccount	License key name already exists for the account.
701	RefundTypeAndPercentageMismatch	You specified a `Full` refund, but the percentage parameter was not null.
702	InvalidDocumentTypeForRefund	The document you attempted to refund was not a SalesInvoice.
703	RefundTypeAndLineMismatch	You specified a `Full` refund, but the lines parameter was not null.
704	RefundLinesRequired	Your RefundTransaction API call was missing necessary information.
705	InvalidRefundType	You specified an invalid refund type.
706	RefundPercentageForTaxOnly	You attempted to create a TaxOnly refund for a partial percentage.
707	LineNoOutOfRange	You attempted to refund a line item that did not exist in the original transaction.
708	RefundPercentageOutOfRange	You submitted a refund percentage lower than 0% or higher than 100%
709	RefundPercentageMissing	You specified a refund type of percentage, but did not specify the percentage.
800	MustUseCreateTransaction	The free tax rates API applies only to transactions within the United States.
801	MustAcceptTermsAndConditions	You must read and accept Avalara's terms and conditions to get a FreeTrial Account
900	FilingCalendarCannotBeDeleted	A filing calendar cannot be deleted once in use.
901	InvalidEffectiveDate	The effective date for your filing request is not valid.
902	NonOutletForm	This form does not permit Outlet or Location-based reporting.
903	OverlappingFilingCalendar	This filing calendar overlaps with another calendar.
904	FilingCalendarCannotBeEdited	The filing calander cannot be edited.
1100	CannotModifyLockedTransaction	A locked transaction may not be modified.
1101	LineAlreadyExists	You attempted to add a line with a conflicting line number.
1102	LineDoesNotExist	You attempted to remove a line that did not exist.
1103	LinesNotSpecified	You attempted to create a transaction with zero lines.
1104	LineDetailsDoesNotExist	The specified line detail ID cannot be found.
1105	CannotCreateTransactionWithDeletedDataSource	The selected DataSource has been deleted and cannot be used for creating a transaction.
1106	ShipToRegionRequiredWithDataSource	ShipTo region required.
1200	InvalidBusinessType	The business type field on the ECMS record is invalid.
1201	CannotModifyExemptCert	Exemption certificates cannot be modified using the Company API.
1203	CertificatesError	The certificate API has returned an error.
1204	MissingRequiredFields	A certificate must have either a filename, a PDF file attachment, or one JPG image for each page in the certificate.
1205	CertificatesNotSetup	The company has not been configured with this certificate.
1208	ConflictingExposureZone	Exposure zones must have unique names.
1209	MissingFieldToCreateExposureZone	Avalara's Certificates service requires extra information to create an exposure zone.
1210	MissingExemptReason	A certificate must have an exemption reason.
1211	InvalidExemptReason	The exemption reason you specified cannot be found.
1212	InvalidExemptionOperation	Filtering operation is not supported
1213	ConflictingFields	A certificate must have be stored in only one format: filename, PDF, or images.
1214	InvalidPdfOrImageFile	You provided a value in the PDF or image file fields, but the value was empty.
1215	InvalidCoverLetterTitle	THe cover letter you specified for this CertExpress invitation was not found.
1216	AccountNotProvisioned	The automatic provisioning process for exemption certificates failed.
1217	InvalidRequestContentType	Invalid request content type in the request.
1218	ExemptionPaginationLimits	AvaTax exemption data does not support this type of pagination.
1219	ExemptionSortLimits	AvaTax exemption data does not support sorting by more than one field.
1220	CustomerCantBeBothShipToAndBillTo	An AvaTax customer record can be either a BillTo customer address or a ShipTo customer address, but not both.
1221	BillToCustomerExpected	The API call you made requires a BillTo customer as a parameter, but you used a ShipTo customer.
1222	ShipToCustomerExpected	The API call you made expects a ShipTo customer record, but you supplied a BillTo customer instead.
1223	EcmsSstCertsRequired	The `EcmsSstCertsRequired` field should be set to true.
1300	TransactionNotCancelled	A multi-company transaction was partially created.
1301	TooManyTransactions	The MultiDocument transaction you attempted to create is too complex.
1302	OnlyTaxDateOverrideIsAllowed	Multi-company transactions may only override tax dates.
1303	TransactionAlreadyExists	This transaction already exists and cannot be overwritten.
1305	DateMismatch	The values in your verify call did not match the transaction.
1306	InvalidDocumentStatusForVerify	Documents can only be verified from the `Saved` or `Posted` statuses.
1307	TotalAmountMismatch	The values in your verify call did not match the transaction.
1308	TotalTaxMismatch	The values in your verify call did not match the transaction.
1310	InvalidDocumentType	A document could not be found with the specified type.
1312	MultiDocumentPartiallyLocked	A MultiDocument was partially locked for reporting.
1313	TransactionIsCommitted	This API can only modify transactions that are not yet committed.
1314	InvalidDocumentStatus	The document status is incorrect for this operation.
1400	CommsConfigClientIdMissing	You attempted to call a Communications tax API, but your client ID value is missing.
1401	CommsConfigClientIdBadValue	The Avalara Communications Client ID value associated with your account is invalid.
1404	AccountInNewStatusException	You may not obtain a license key until you have accepted Avalara's terms and conditions.
1405	WorksheetException	An error occurred in the Liability Worksheet calculation service.
1406	InvalidAccountOverride	Invalid AccountOverride format.
1407	AccountOverrideNotAuthorized	The current role you are in does not permit account override function
1408	FieldNotQueryableError	A field in the query is not a queryable.
1409	UsernameRequired	A username is required
1410	InvalidAuditMessage	Please review your audit message and ensure no special characters are used.
1411	FieldNotOrderableError	The field you have tried to sort cannot be organized in the desired manner.
1500	CannotDeleteParentBeforeChildNexus	The nexus cannot be deleted due to child nexus tied to it.
1501	NexusChildDateMismatch	Nexus out of date range with its children.
1502	RemoteValidationError	The AvaTax API encountered an internal error and could not continue.
1503	CannotModifySstNexus	SST nexuses cannot be modified by user.
1504	InvalidLocalNexusTypeId	LocalNexusTypeId of 'All' cannot be used.
1602	AdvancedRuleRequestRuleError	Advanced rule failed to execute.
1603	AdvancedRuleResponseRuleError	Failed to execute the advanced rule script.
1605	AdvancedRuleError	An error occured when using or applying Advanced Tax Rules.
1701	TaxRuleRequiresNexus	Nexus is not declared in this region, therefore no tax rule can be created.
1702	UPCCodeNotUnique	A single UPC code can be defined only once for each company.
1704	TaxCodeAssociatedWithItemCodeNotFound	The tax code in the request could not be found.
1705	DuplicateSystemForItem	An item in this request has multiple entries for a given system code.
1706	CannotDismissGlobalNotification	This notification cannot be dismissed because it is a global notification.
1713	CannotUpdateAccountTypeId	Cannot update AccountTypeId.
1714	TaxpayerNumberIsRequired	TaxpayerIdNumber is required.
1715	RequestLimitExceeded	You have submitted too many requests.
1716	ConcurrentRequestLimitExceeded	The server is currently busy.
1717	InvalidDocumentTypeForInspect	Please specify a valid specific documentType for this API to provide accurate results.
1718	ServiceNotReady	Service not ready
1719	UpdateLocationRemittanceMismatchTypeAndCategory	Existing location must have address type Marketplace and the new address category type of either SellerRemitsTax or MarketplaceRemitsTax.
1720	UpdateLocationRemittanceCheckExistingEffectiveDateError	New effective date should be at least a day after the existing location's effective date.
1721	UpdateLocationRemittanceCheckExistingEndDateError	Invalid end date.
1722	ErrorCountLimitExceededError	The request has exceeded the maximum number of validation errors.
1723	RateLimitExceededError	The request has exceeded the maximum number of concurrent transactions.
1800	UnsupportedFileFormat	The requested output file format is invalid.
1801	UnsupportedOutputFileType	You must specify either CSV or JSON file formats.
1900	TaxProfileNotProvided	A tax profile was not included in your request.
1901	InvalidTaxProfile	The tax profile must be a valid ZIP file.
1902	CompanyTaxProfileEntryRequired	The import tax profile request is missing a company model and company tax profile.
1903	ErrorReadingTaxProfileEntry	AvaTax was unable to parse your tax profile entry.
2000	TraceDataNotAvailable	The trace data is not available for the date and time selected.
2100	InvalidParameterUnitMeasurementType	A paremeter in the request has an unexpected unit of measurement type.
2101	ParameterUnitRequired	A parameter in the request doesn't have a unit of measure.
2102	InvalidParameterValueDataType	A parameter value in the request has an invalid data type.
2103	InvalidParameterAttributeType	A parameter in the request doesn't match the expected attribute type.
2104	SubscriptionRequiredForParameter	The account's subscription level doesn't include use of the parameter in your request.
2105	InvalidAccountType	Account Type must be 'firm' for this action.
2106	InvalidFirmSubscriptions	Firm doesn't have required subscriptions for linkage.
2200	GenericTaxCodeForItem	Company item contains a generic taxcode.
2201	CannotCertifyCompany	Company cannot be certified.
2202	NoVoidedDocuments	Company does not have any voided documents.
2203	InadequateCommittedDocuments	Company must have at least two committed documents.
2204	DocumentCodeIsGuid	Company has a document code which is a GUID.
2205	CustomerVendorCodeIsGuid	Company's customer vendor code is a GUID.
2206	InadequateDocumentLineCount	Company has inadequate document line count.
2207	SameDocumentDescription	All documents have same description.
2208	NoExemptionNoOrCustomerUsageType	The exemption number or customer usage type is missing.
2209	InadequateUniqueAddresses	Recent documents do not show at least 2 unique addresses.
2210	ItemCodesAreAllSame	All item codes for the document are the same.
2211	TaxCodesAreAllSame	All tax codes for the documents are the same.
2212	LocationCodeNotUsed	Company documents don't have a location code.
2213	RepeatedLinesInDocument	Company has repeated lines in a document.
2214	TaxDateOverrideAndNegativeLineAmount	Company has tax DateOverride and negative LineAmount.
2215	AllUSDCurrencyCodes	All recent documents have USD currency codes.
2216	NoVATBuyerId	Company does not have VATBuyerId.
2217	AllUSCountryCodes	Company has only US country codes.
2218	NoDocumentsToTest	This company doesn't have documents.
2219	NoShippingCharge	No shipping charge in recent documents.
2314	FailedToUpdateCompanyLocation	Failed to update the location of this company.
2315	CompanyLocationDateRangeOverlap	The requested date range is not allowed.
2400	FieldLengthError	A field has an invalid length.
2401	InputContainsBlacklistedCharacters	The input for this field contains blacklisted characters
2402	CannotCreateNestedObjects	Cannot include new object(s) of different type within the request object.
2501	BatchTransactionTypeError	A batch transaction must use exactly one of the following properties: CreateTransactionModel, AdjustTransactionModel, VoidTransactionModel.
2502	BatchTransactionLineLimitExceeded	The batch transaction contains too many transaction lines.
2503	BatchCompanyIdAndCompanyCodeMismatch	Batch transaction's Company ID and Company Code does not match.
2504	BatchCannotBeCancelledStatusError	A batch can only be canceled while its state is waiting or processing.
2505	BatchCannotBeCancelledFormatError	File batches cannot be canceled.
2600	InvalidParameterDataType	The required parameter data type when creating a parameter is not correct.
2601	VersionTooOld	The version requested is no longer supported.
2602	VersionNotValid	The verison requested is not valid.
