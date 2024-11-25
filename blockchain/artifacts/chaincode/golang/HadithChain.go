package main

import (
	"encoding/json"
	"fmt"
	"time"
    "strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric-chaincode-go/shim"

)

type HadithContract struct {
	contractapi.Contract
}

type Hadith struct {
    HadithID              string    `json:"hadithId"`
    Hadith                string    `json:"Hadith"`
    TheFirstNarrator      string    `json:"TheFirstNarrator"`
    ReportedBy            string    `json:"ReportedBy"`
    RulingOfTheReported   string    `json:"RulingOfTheReported"`
    // Source                []string  `json:"Source"`
    PageOrNumber          string    `json:"PageOrNumber"`
    OrgID                 interface{} `json:"orgId"`  
    RegistrationType      string    `json:"registrationType"`
    HadithStatus          string    `json:"hadithStatus"`
    CreatedBy             string    `json:"createBy"`
    CreateAt              string    `json:"createAt"`
	PreviousHadithID string `json:"previousHadithId"`

}


type Document struct {
    Name string `json:"name"`
    URL  string `json:"url"`
}

type HadithRecord struct {
    CreateAt            string    `json:"CreateAt"`
    CreateBy            string    `json:"CreateBy"`
    Document            Document  `json:"Document"`
    Hadith              string    `json:"Hadith"`
    HadithId            string    `json:"HadithId"`
    HadithStatus        string    `json:"HadithStatus"`
    ID                  string    `json:"ID"`
    OrgId               int       `json:"OrgId"`
    PageOrNumber        string    `json:"PageOrNumber"`
    RegistrationType    string    `json:"RegistrationType"`
    ReportedBy          string    `json:"ReportedBy"`
    RulingOfTheReported string    `json:"RulingOfTheReported"`
    Source              []string  `json:"Source"`
    Status              string    `json:"Status"`
    TheFirstNarrator    string    `json:"TheFirstNarrator"`
}

type DeleteMetadata struct {
	HadithID   string `json:"hadithId"`
	DeletedBy  string `json:"deletedBy"`
}

var AGREEMENT_STATUS = struct {
	ACTIVE     string
	REJECTED   string
	INPROGRESS string
}{
	ACTIVE:     "active",
	REJECTED:   "rejected",
	INPROGRESS: "inprogress",
}
type JSONResult struct {
	TxId      string      `json:"txId,omitempty"`
	Timestamp string      `json:"timestamp,omitempty"`
	IsDelete  bool        `json:"isDelete,omitempty"`
	Value     interface{} `json:"value,omitempty"`
	DeletedBy string      `json:"deletedBy,omitempty"`
	Action    string      `json:"action,omitempty"`
	Key       string      `json:"key,omitempty"`  
	Record    interface{} `json:"record,omitempty"` 
}

func (hc *HadithContract) AddHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
	// Check client identity
    // cid := ctx.GetClientIdentity()
    // scholarErr := cid.AssertAttributeValue("registrationType", "scholar")
    // studentErr := cid.AssertAttributeValue("registrationType", "StudentOfHadith")   
    // if scholarErr != nil && studentErr != nil {
    //     return "", fmt.Errorf("you are not authorized to perform this operation")
    // }
    

    // Unmarshal hadithData into Hadith struct
    var hadith Hadith
    if err := json.Unmarshal([]byte(hadithData), &hadith); err != nil {
        return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
    }

    // Check if Hadith already exists
    exists, err := hc.HadithExists(ctx, hadith.HadithID)
    if err != nil {
        return "", err
    }
    if exists {
        return "", fmt.Errorf("hadith with ID %s already exists", hadith.HadithID)
    }

    // Store Hadith in state
    if err := ctx.GetStub().PutState(hadith.HadithID, []byte(hadithData)); err != nil {
        return "", fmt.Errorf("failed to add hadith: %v", err)
    }

    // Return the transaction ID
    return ctx.GetStub().GetTxID(), nil
}

func (hc *HadithContract) ApproveHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
    
	// Check if the client has the 'scholar' role.
	// if err := hc.verifyScholarRole(ctx); err != nil {
	// 	return "", fmt.Errorf("you are not authorized to perform this operation")
	// }

	// Parse the input Hadith data
    var hadith map[string]interface{}
    if err := json.Unmarshal([]byte(hadithData), &hadith); err != nil {
        return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
    }

    hadithId := hadith["hadithId"].(string)
    id := hadith["id"].(string)


    // If the Hadith status is "active", retrieve and update it
    if hadith["hadithStatus"] == "active" {
        existingHadith, err := hc.GetHadithByID(ctx, hadithId)
        if err != nil {
            return "", err
        }

        // Update the Hadith status to "active"
		existingHadith.HadithStatus = "active"
        // Store the updated Hadith data
        if err := hc.updateHadithState(ctx, hadithId, existingHadith); err != nil {
            return "", err
        }
    }

    // Remove hadithStatus before saving the new Hadith data
    delete(hadith, "hadithStatus")

    // Save the approve data
    if err := hc.saveHadithData(ctx, id, hadith); err != nil {
        return "", err
    }

    // Log the transaction ID for debugging
    txID := ctx.GetStub().GetTxID()
    fmt.Printf("Transaction ID: %s\n", txID)

    return txID, nil
}


func (hc *HadithContract) ValidateApprovals(ctx contractapi.TransactionContextInterface, hadithId, userStr string) (string, error) {
	// Log the start of the validation process
	fmt.Println("Entering ValidateApprovals function")
	fmt.Printf("Starting validation for Hadith ID: %s\n", hadithId)

	// Retrieve the Hadith by ID
	hadith, err := hc.GetHadithByID(ctx, hadithId)
	if err != nil {
		fmt.Printf("Failed to retrieve Hadith with ID: %s. Error: %v\n", hadithId, err)
		return "", err
	}
	fmt.Printf("Retrieved Hadith: %+v\n", hadith)

	// Check if the Hadith is eligible for approval
	if hadith.PreviousHadithID != "" {
		fmt.Printf("Operation failed: Hadith with ID %s is not a new submission.\n", hadithId)
		return "", fmt.Errorf("operation failed: This operation is intended for approving new Hadith submissions only.")
	} else if hadith.HadithStatus == "active" {
		fmt.Printf("Operation failed: Hadith with ID %s is already active.\n", hadithId)
		return "", fmt.Errorf("operation failed: The Hadith is already active.")
	}

	// Unmarshal the user information
	var user map[string]string
	err = json.Unmarshal([]byte(userStr), &user)
	if err != nil {
		fmt.Printf("Failed to unmarshal user information: %s. Error: %v\n", userStr, err)
		return "", fmt.Errorf("failed to unmarshal user: %v", err)
	}
	fmt.Printf("Unmarshaled user info: %+v\n", user)

	// Query for Hadith approvals using the new method
	approvals, err := hc.QueryApprovalsByHadithId(ctx, hadithId)
	if err != nil {
		fmt.Printf("Failed to query approvals for Hadith ID: %s. Error: %v\n", hadithId, err)
		return "", fmt.Errorf("failed to query hadith approvals: %v", err)
	}

	scholarCount := 0
	fmt.Printf("Processing approvals for Hadith ID: %s\n", hadithId)

	for _, record := range approvals {
		orgIDStr, ok := record["OrgId"].(string)
		if !ok {
			fmt.Printf("Failed to extract OrgId from record: %+v\n", record)
			continue
		}

		// Check if the user's organization has already approved this Hadith
		if record["RegistrationType"] == user["registrationType"] && orgIDStr == user["orgId"] {
			fmt.Printf("Hadith with ID %s has already been approved by the user's institution (Org ID: %s).\n", hadithId, orgIDStr)
			return "", fmt.Errorf("This Hadith has already been marked as approved by your institution.")
		}

		// Count approvals from scholars
		if record["RegistrationType"] == "scholar" {
			scholarCount++
		}
		fmt.Printf("Current scholar approval count: %d\n", scholarCount)
	}

	// Determine the final approval status
	if scholarCount > 0 {
		fmt.Printf("Hadith ID: %s has sufficient scholar approvals. Status: ACTIVE\n", hadithId)
		return AGREEMENT_STATUS.ACTIVE, nil
	}

	fmt.Printf("Hadith ID: %s is still in progress. Status: INPROGRESS\n", hadithId)
	return AGREEMENT_STATUS.INPROGRESS, nil
}

// DeleteHadith deletes a hadith and associated approvals from the blockchain.
func (hc *HadithContract) DeleteHadith(ctx contractapi.TransactionContextInterface, id, deletedBy string, active string) (string, error) {
	// Check if the client has the 'scholar' role.
	// if err := hc.verifyScholarRole(ctx); err != nil {
	// 	return "", fmt.Errorf("you are not authorized to perform this operation")
	// }

	// Retrieve the hadith to be deleted.
	hadith, err := hc.GetHadithByID(ctx, id)
	if err != nil {
		return "", err
	}

	// Validate conditions for deleting the hadith.
	if err := hc.validateDeletionConditions(hadith, active); err != nil {
		return "", err
	}

	// Delete the hadith from the world state.
	if err := hc.recordDeletion(ctx, id, deletedBy); err != nil {
		return "", err
	}
	// Delete the Approvals from the world state.
	if err := hc.deleteHadithAndApprovals(ctx, id); err != nil {
		return "", err
	}

	// Return success message.
	return fmt.Sprintf("Hadith %s and its approvals have been deleted successfully", id), nil
}
// UpdateHadith updates an existing hadith on the blockchain.
func (hc *HadithContract) UpdateHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
	// Check if the client has the 'scholar' role.
	// if err := hc.verifyScholarRole(ctx); err != nil {
	// 	return "", fmt.Errorf("you are not authorized to perform this operation")
	// }

	// Unmarshal the hadith data from JSON.
	var hadith Hadith
	if err := json.Unmarshal([]byte(hadithData), &hadith); err != nil {
		return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
	}

	// Check if the hadith already exists.
	exists, err := hc.HadithExists(ctx, hadith.HadithID)
	if err != nil {
		return "", err
	}
	if exists {
		return "", fmt.Errorf("hadith with ID %s already exists", hadith.HadithID)
	}

	// Retrieve and check the status of the previous hadith.
	previousHadith, err := hc.GetHadithByID(ctx, hadith.PreviousHadithID)
	if err != nil {
		return "", err
	}
	if previousHadith.HadithStatus == "inprogress" {
		return "", fmt.Errorf("hadith with ID %s is in progress", hadith.PreviousHadithID)
	}

	// Store the new hadith data on the blockchain.
	if err := ctx.GetStub().PutState(hadith.HadithID, []byte(hadithData)); err != nil {
		return "", fmt.Errorf("failed to update hadith: %v", err)
	}

	// Return the transaction ID.
	return ctx.GetStub().GetTxID(), nil
}
func (hc *HadithContract) ApproveAndRejectForUpdateHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
	// Check if the client is a scholar
	// if err := hc.verifyScholarRole(ctx); err != nil {
	// 	return "", fmt.Errorf("you are not authorized to perform this operation")
	// }

	// Parse the input Hadith data
	var hadith map[string]interface{}
	if err := json.Unmarshal([]byte(hadithData), &hadith); err != nil {
		return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
	}

	hadithId := hadith["hadithId"].(string)
	id := hadith["id"].(string)
	createBy := hadith["createBy"].(string)
	hadithStatus := hadith["hadithStatus"].(string)

	if hadithStatus == "rejected" {
		// Delete the hadith directly if it is rejected
		_, err := hc.DeleteHadith(ctx, hadithId, createBy, "false")
		if err != nil {
			return "", fmt.Errorf("failed to delete rejected hadith: %v", err)
		}
		return ctx.GetStub().GetTxID(), nil
	}

	if hadithStatus == "active" {
		existingHadith, err := hc.GetHadithByID(ctx, hadithId)
		if err != nil {
			return "", err
		}

		// Use correct type assertions to access fields
		previousHadithId := existingHadith.PreviousHadithID
		CreatedBy := existingHadith.CreatedBy

		// Call DeleteHadith
		_, err = hc.DeleteHadith(ctx, previousHadithId, CreatedBy, "false")
		if err != nil {
			return "", fmt.Errorf("failed to delete previous hadith: %v", err)
		}

		// Update the Hadith status to "active"
		existingHadith.HadithStatus = "active"

		// Store the updated Hadith data
		if err := hc.updateHadithState(ctx, hadithId, existingHadith); err != nil {
			return "", err
		}
	}

	// Remove hadithStatus before saving the new Hadith data
	delete(hadith, "hadithStatus")

	// Save the approve data
	if err := hc.saveHadithData(ctx, id, hadith); err != nil {
		return "", err
	}

	// Log the transaction ID for debugging
	txID := ctx.GetStub().GetTxID()
	fmt.Printf("Transaction ID: %s\n", txID)

	return txID, nil
}

func (hc *HadithContract) ValidateHadithUpdateApprovalAndRejection(ctx contractapi.TransactionContextInterface, hadithId, statusStr, userStr string) (string, error) {
	// Check if the client is a scholar
	// if err := hc.verifyScholarRole(ctx); err != nil {
	// 	return "", fmt.Errorf("you are not authorized to perform this operation")
	// }

    // Retrieve the Hadith by ID
    hadith, err := hc.GetHadithByID(ctx, hadithId)
    if err != nil {
        return "", err
    }

    // Validate the Hadith state
	if err := hc.validateHadithStatusForUpdateHadith(hadith); err != nil {
		return "", err
	}
    // Extract user and status information
    user, err := hc.extractUserInfo(userStr)
    if err != nil {
        return "", err
    }
    status, err := hc.extractStatusInfo(statusStr)
    if err != nil {
        return "", err
    }

    // Extract relevant fields from user and status
    email := user["email"].(string)
    userOrgId := user["orgId"].(string)
    userStatus := status["status"].(string)

	fmt.Printf("Validating approvals for HadithId: %s and user: %v\n", hadithId, user)

    // Query for Hadith approvals using the new function
    approvals, err := hc.QueryApprovalsByHadithId(ctx, hadithId)
    if err != nil {
        return "", fmt.Errorf("failed to query hadith approvals: %v", err)
    }

    // Initialize counts based on userStatus
    approvalCount := 0
    rejectionCount := 0
    if userStatus == "approved" {
        approvalCount = 1
    } else if userStatus == "rejected" {
        rejectionCount = 1
    }

   // Iterate through the approvals
    for _, approval := range approvals {
        createBy, _ := approval["CreateBy"].(string)
        orgId, _ := approval["OrgId"].(string)
        approvalStatus, _ := approval["Status"].(string)

        // Check if the user is trying to approve or reject their own Hadith
        if createBy == email {
            return "", fmt.Errorf("You cannot approve or reject your own Hadith.")
        }

        // Check if the Hadith has already been marked as approved/rejected by the user's institution
        if orgId == userOrgId {
            if approvalStatus == "approved" && userStatus == "approved" {
                return "", fmt.Errorf("A scholar from your organization has already approved this Hadith.")
            } else if approvalStatus == "rejected" && userStatus == "rejected" {
                return "", fmt.Errorf("A scholar from your organization has already rejected this Hadith.")
            }
        }

        // Count the number of approvals and rejections
        if approvalStatus == "approved" {
            approvalCount++
        } else if approvalStatus == "rejected" {
            rejectionCount++
        }

        // Early exit conditions to avoid unnecessary iterations
        if approvalCount >= 2 {
            return AGREEMENT_STATUS.ACTIVE, nil
        } else if rejectionCount >= 2 {
            return AGREEMENT_STATUS.REJECTED, nil
        }
    }

    return AGREEMENT_STATUS.INPROGRESS, nil
}
// QueryHadith retrieves a Hadith by its ID from the blockchain.
func (hc *HadithContract) QueryApprovalsByHadithId(ctx contractapi.TransactionContextInterface, hadithId string) ([]map[string]interface{}, error) {
	queryString := fmt.Sprintf(`{"selector":{"hadithId":"%s"}}`, hadithId)
	fmt.Printf("Querying approvals for HadithId: %s\n", hadithId)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to query approvals by HadithId: %v", err)
	}
	defer resultsIterator.Close()

	results, err := hc.getAllResultsFromIterator(resultsIterator)
	if err != nil {
		return nil, fmt.Errorf("failed to get results from iterator: %v", err)
	}

	return results, nil
}

func (hc *HadithContract) getAllResultsFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]map[string]interface{}, error) {
    var results []map[string]interface{}

    // Iterate over the results from the iterator
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, fmt.Errorf("failed to get next result: %v", err)
        }

        // Log the raw JSON response
        fmt.Println("Raw Query Response:", string(queryResponse.Value))

        var hadith HadithRecord
        // Unmarshal the JSON data into HadithRecord struct
        if err := json.Unmarshal(queryResponse.Value, &hadith); err != nil {
            fmt.Printf("Error unmarshalling: %v\n", err)
            continue
        }

        // Log the populated hadith struct
        fmt.Printf("Populated Hadith: %+v\n", hadith)

        // Skip appending if CreateBy is empty
        if hadith.CreateBy == "" {
            fmt.Println("Skipping record due to empty CreateBy")
            continue
        }

        // Create a map of the relevant fields from the HadithRecord
        record := map[string]interface{}{
            "Hadith":              hadith.Hadith,
            "ReportedBy":          hadith.ReportedBy,
            "Status":              hadith.Status,  // No nested Status
            "CreateAt":            hadith.CreateAt,
            "CreateBy":            hadith.CreateBy,
            "HadithId":            hadith.HadithId,
            "HadithStatus":        hadith.HadithStatus,
            "PageOrNumber":        hadith.PageOrNumber,
            "RulingOfTheReported": hadith.RulingOfTheReported,
            "Source":              hadith.Source,
            "TheFirstNarrator":    hadith.TheFirstNarrator,
            "Document": map[string]interface{}{
                "name": hadith.Document.Name,
                "url":  hadith.Document.URL,
            },
            "ID":                 hadith.ID,
            "OrgId":              hadith.OrgId,
            "RegistrationType":   hadith.RegistrationType,
        }

        // Log the fetched record
        fmt.Printf("Fetched record: %+v\n", record)
        results = append(results, record)
    }

    return results, nil
}


func (hc *HadithContract) GetHadithHistory(ctx contractapi.TransactionContextInterface, id string) (map[string]interface{}, error) {
	history, err := hc.getHistoryById(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get history by ID: %v", err)
	}

	approvalResults, err := hc.QueryApprovalsByHadithId(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query approvals by HadithId: %v", err)
	}

	result := map[string]interface{}{
		"results":         history,
		"approvalResults": approvalResults,
	}
	return result, nil
}
//GetHistoryById retrieves the history of a Hadith by its ID
func (hc *HadithContract) getHistoryById(ctx contractapi.TransactionContextInterface, id string) ([]map[string]interface{}, error) {
	iterator, err := ctx.GetStub().GetHistoryForKey(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get history for key: %v", err)
	}
	defer iterator.Close()

	var allResults []map[string]interface{}

	for iterator.HasNext() {
		response, err := iterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate over history: %v", err)
		}
  
		var record map[string]interface{}
		txID := response.TxId
		timestamp := time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).UTC().Format(time.RFC3339)
		isDelete := response.IsDelete
        fmt.Errorf("response.IsDelete: %v", response.IsDelete)
        // Check if the record is a delete or update
		if isDelete {
			// Check if there is delete metadata stored with the key "delete_" + id
			deleteMetadataKey := "delete_" + id
            fmt.Errorf("deleteMetadataKey: %v", deleteMetadataKey)
			deleteMetadataBytes, err := ctx.GetStub().GetState(deleteMetadataKey)
			deletedBy := "Unknown"

			if err == nil && deleteMetadataBytes != nil {
				var deleteMetadata DeleteMetadata
				err = json.Unmarshal(deleteMetadataBytes, &deleteMetadata)
				if err == nil {
					deletedBy = deleteMetadata.DeletedBy
				}
			}

			record = map[string]interface{}{
				"TxId":      txID,
				"Action":    "DELETED",
				"Timestamp": timestamp,
				"DeletedBy": deletedBy,
			}
		} else {
			value := map[string]interface{}{}
			json.Unmarshal(response.Value, &value)
			action := "UPDATED"
			if value["hadithStatus"] == "inprogress" {
				action = "CREATED"
			}
			record = map[string]interface{}{
				"TxId":      txID,
				"Action":    action,
				"Timestamp": timestamp,
				"Value":     value,
			}
		}

		allResults = append(allResults, record)
	}
	return allResults, nil
}
// GetDataWithPagination retrieves data with pagination
func (hc *HadithContract) GetDataWithPagination(ctx contractapi.TransactionContextInterface, queryString string, pageSize string, bookmark string) (map[string]interface{}, error) {
    pageSizeInt, err := strconv.Atoi(pageSize)
    if err != nil {
        return nil, fmt.Errorf("invalid page size: %v", err)
    }

    iterator, metadata, err := ctx.GetStub().GetQueryResultWithPagination(queryString, int32(pageSizeInt), bookmark)
    if err != nil {
        return nil, fmt.Errorf("failed to get query result with pagination: %v", err)
    }
    defer iterator.Close()

    results, err := hc.getAllResultsFromIterator(iterator)
    if err != nil {
        return nil, err
    }

    finalData := map[string]interface{}{
        "data": results,
        "metadata": map[string]interface{}{
            "RecordsCount": metadata.FetchedRecordsCount,
            "Bookmark":     metadata.Bookmark,
        },
    }

    return finalData, nil
}

func (hc *HadithContract) GetData(ctx contractapi.TransactionContextInterface) ([]map[string]interface{}, error) {
    // Fetch the state by range
    iterator, err := ctx.GetStub().GetStateByRange("", "")
    if err != nil {
        return nil, fmt.Errorf("failed to get state by range: %v", err)
    }
    defer iterator.Close()

    var results []map[string]interface{}

    // Iterate over the results
    for iterator.HasNext() {
        queryResponse, err := iterator.Next()
        if err != nil {
            return nil, fmt.Errorf("failed to get next state: %v", err)
        }

        var hadith HadithRecord
        // Unmarshal the response into the HadithRecord struct
        if err := json.Unmarshal(queryResponse.Value, &hadith); err != nil {
            // If unmarshal fails, skip this record
            continue
        }

        // Filter records with HadithStatus as "INPROGRESS"
        if hadith.HadithStatus == "INPROGRESS" {
            record := map[string]interface{}{
                "Hadith":              hadith.Hadith,
                "ReportedBy":          hadith.ReportedBy,
                "Status":              hadith.Status,  // No nested Status field
                "CreateAt":            hadith.CreateAt,
                "CreateBy":            hadith.CreateBy,
                "HadithId":            hadith.HadithId,
                "HadithStatus":        hadith.HadithStatus,
                "PageOrNumber":        hadith.PageOrNumber,
                "RulingOfTheReported": hadith.RulingOfTheReported,
                "Source":              hadith.Source,
                "TheFirstNarrator":    hadith.TheFirstNarrator,
                "Document": map[string]interface{}{
                    "name": hadith.Document.Name,
                    "url":  hadith.Document.URL,
                },
                "ID":                 hadith.ID,
                "OrgId":              hadith.OrgId,
                "RegistrationType":   hadith.RegistrationType,
            }
            results = append(results, record)
        }
    }

    return results, nil
}


                                            // Helper functions


// Helper unmarshals user information from a JSON string
func (hc *HadithContract) extractUserInfo(userStr string) (map[string]interface{}, error) {
    var user map[string]interface{}
    if err := json.Unmarshal([]byte(userStr), &user); err != nil {
        return nil, fmt.Errorf("failed to unmarshal user: %v", err)
    }
    return user, nil
}

// Helper unmarshals status information from a JSON string
func (hc *HadithContract) extractStatusInfo(statusStr string) (map[string]interface{}, error) {
    var status map[string]interface{}
    if err := json.Unmarshal([]byte(statusStr), &status); err != nil {
        return nil, fmt.Errorf("failed to unmarshal status: %v", err)
    }
    return status, nil
}
//Helper function to retrieve an existing Hadith from the ledger
func (hc *HadithContract) GetHadithByID(ctx contractapi.TransactionContextInterface, hadithId string) (*Hadith, error) {
    // Retrieve the Hadith JSON from the ledger using the provided Hadith ID
    hadithJSON, err := ctx.GetStub().GetState(hadithId)
    if err != nil {
        return nil, fmt.Errorf("failed to get Hadith from state: %v", err)
    }

    // Check if the Hadith exists
    if hadithJSON == nil || len(hadithJSON) == 0 {
        return nil, fmt.Errorf("Hadith with ID %s does not exist", hadithId)
    }

    // Parse the Hadith JSON into a Hadith struct
    var hadith Hadith
    err = json.Unmarshal(hadithJSON, &hadith)
    if err != nil {
        return nil, fmt.Errorf("failed to unmarshal Hadith JSON: %v", err)
    }

    return &hadith, nil
}
// Helper function checks whether a hadith with the given ID exists in the ledger
func (hc *HadithContract) HadithExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
    hadithJSON, err := ctx.GetStub().GetState(id)
    if err != nil {
        return false, fmt.Errorf("failed to get hadith: %v", err)
    }

    return hadithJSON != nil && len(hadithJSON) > 0, nil
}
// Helper function marshals and stores the Hadith data in the ledger
func (hc *HadithContract) updateHadithState(ctx contractapi.TransactionContextInterface, hadithId string, hadith *Hadith) error {
    hadithBytes, err := json.Marshal(hadith)
    if err != nil {
        return fmt.Errorf("failed to marshal hadith data: %v", err)
    }

    if err := ctx.GetStub().PutState(hadithId, hadithBytes); err != nil {
        return fmt.Errorf("failed to put hadith state: %v", err)
    }

    return nil
}
// Helper function to  marshals the Hadith data and saves it to the ledger
func (hc *HadithContract) saveHadithData(ctx contractapi.TransactionContextInterface, id string, hadith map[string]interface{}) error {
    hadithBytes, err := json.Marshal(hadith)
    if err != nil {
        return fmt.Errorf("failed to marshal hadith data: %v", err)
    }
    if err := ctx.GetStub().PutState(id, hadithBytes); err != nil {
        return fmt.Errorf("failed to put hadith state: %v", err)
    }
    return nil
}

// Helper function to  checks if the Hadith status allows for approval New Hadith
func (hc *HadithContract) validateHadithStatus(hadith *Hadith) error {
    if hadith.PreviousHadithID != "" {
        return fmt.Errorf("operation failed: This operation is intended for approving new Hadith submissions only.")
    }

    if hadith.HadithStatus == "active" {
        return fmt.Errorf("operation failed: The Hadith is already active.")
    }

    return nil
}
// Helper function to  checks if the Hadith status allows for approval Update Hadith
func (hc *HadithContract) validateHadithStatusForUpdateHadith(hadith *Hadith) error {

	if hadith.PreviousHadithID == "" {
        return fmt.Errorf("operation failed: This operation is intended for updates to an existing Hadith.")
    }

    if hadith.HadithStatus == "active" {
        return fmt.Errorf("operation failed: The Hadith is already active.")
    }

    return nil
}

// Helper function to validate deletion conditions.
func (hc *HadithContract) validateDeletionConditions(hadith *Hadith, active string) error {
	if hadith.PreviousHadithID != "" && active == "true" {
		return fmt.Errorf("operation failed: this operation is reserved for rejecting new hadith submissions")
	}
	if hadith.HadithStatus == "active" && active == "true" {
		return fmt.Errorf("operation failed: the hadith is already active")
	}
	return nil
}
// Helper function to record deletion metadata.
func (hc *HadithContract) recordDeletion(ctx contractapi.TransactionContextInterface, id, deletedBy string) error {
	deleteMetadata := DeleteMetadata{
		HadithID:  id,
		DeletedBy: deletedBy,
	}
	deleteMetadataBytes, err := json.Marshal(deleteMetadata)
	if err != nil {
		return fmt.Errorf("failed to marshal delete metadata: %v", err)
	}
	return ctx.GetStub().PutState("delete_"+id, deleteMetadataBytes)
}
// Helper function to delete hadith and its approvals.
func (hc *HadithContract) deleteHadithAndApprovals(ctx contractapi.TransactionContextInterface, id string) error {
	if err := ctx.GetStub().DelState(id); err != nil {
		return fmt.Errorf("failed to delete hadith: %v", err)
	}

	approvals, err := hc.QueryApprovalsByHadithId(ctx, id)
	if err != nil {
		return err
	}
	for _, approval := range approvals {
		if hadithID, ok := approval["Key"].(string); ok && hadithID != "" {
			if err := ctx.GetStub().DelState(hadithID); err != nil {
				return fmt.Errorf("failed to delete approval with ID %s: %v", hadithID, err)
			}
		}
	}
	return nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(HadithContract))
	if err != nil {
		fmt.Printf("Error create HadithContract chaincode: %v", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting HadithContract chaincode: %v", err)
	}
}