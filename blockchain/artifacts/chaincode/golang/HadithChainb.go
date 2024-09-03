// package main

// import (
//     "encoding/json"
//     "fmt"

//     "github.com/hyperledger/fabric-contract-api-go/contractapi"
// )

// // HadithContract provides functions for managing a Hadith
// type HadithContract struct {
//     contractapi.Contract
// }

// // Hadith represents the structure of a Hadith
// type Hadith struct {
//     HadithID string `json:"hadithId"`
//     // Add other fields as required
// }

// AddHadith adds a new Hadith to the ledger
// func (hc *HadithContract) AddHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
//     var hadith Hadith
//     err := json.Unmarshal([]byte(hadithData), &hadith)
//     if err != nil {
//         return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
//     }

//     exists, err := hc.HadithExists(ctx, hadith.HadithID)
//     if err != nil {
//         return "", fmt.Errorf("failed to check if hadith exists: %v", err)
//     }
//     if exists {
//         return "", fmt.Errorf("hadith with ID %s already exists", hadith.HadithID)
//     }

//     err = ctx.GetStub().PutState(hadith.HadithID, []byte(hadithData))
//     if err != nil {
//         return "", fmt.Errorf("failed to add hadith: %v", err)
//     }

//     return ctx.GetStub().GetTxID(), nil
// }

// // HadithExists checks if a Hadith with the given ID exists
// func (hc *HadithContract) HadithExists(ctx contractapi.TransactionContextInterface, hadithID string) (bool, error) {
//     hadithData, err := ctx.GetStub().GetState(hadithID)
//     if err != nil {
//         return false, fmt.Errorf("failed to read hadith data: %v", err)
//     }
//     return hadithData != nil, nil
// }

// func main() {
//     chaincode, err := contractapi.NewChaincode(&HadithContract{})
//     if err != nil {
//         fmt.Printf("Error creating Hadith contract chaincode: %v", err)
//         return
//     }

//     if err := chaincode.Start(); err != nil {
//         fmt.Printf("Error starting Hadith contract chaincode: %v", err)
//     }
// }

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

type HadithRecord struct {
	Hadith              string   `json:"Hadith"`
	PageOrNumber        string   `json:"PageOrNumber"`
	ReportedBy          string   `json:"ReportedBy"`
	RulingOfTheReported string   `json:"RulingOfTheReported"`
	Source              []string `json:"Source"`
	TheFirstNarrator    string   `json:"TheFirstNarrator"`
	CreateAt            string   `json:"createAt"`
	CreateBy            string   `json:"createBy"`
	Document            struct {
		Name string `json:"name"`
		URL  string `json:"url"`
	} `json:"document"`
	HadithId         string `json:"hadithId"`
	HadithStatus     string `json:"hadithStatus"`
	ID               string `json:"id"`
	OrgId            int    `json:"orgId"`
	RegistrationType string `json:"registrationType"`
	Status           struct {
		Status string `json:"status"`
	} `json:"status"`
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
// JSONResult represents the structure of each result in the allResults slice
// type JSONResult struct {
// 	TxId      string      `json:"txId,omitempty"`
// 	Timestamp time.Time   `json:"timestamp,omitempty"`
// 	IsDelete  bool        `json:"isDelete,omitempty"`
// 	Key       string      `json:"key,omitempty"`
// 	Value     interface{} `json:"value,omitempty"`
// 	Record    interface{} `json:"record,omitempty"`
// }
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



// Ensure all usages of JSONResult reflect the updated structure

func (hc *HadithContract) AddHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
   
	// Check client identity
    cid := ctx.GetClientIdentity()
    scholarErr := cid.AssertAttributeValue("registrationType", "scholar")
    studentErr := cid.AssertAttributeValue("registrationType", "StudentOfHadith")
    
    if scholarErr != nil && studentErr != nil {
        return "", fmt.Errorf("you are not authorized to perform this operation")
    }
    
    // Unmarshal hadithData into Hadith struct
    var hadith Hadith
    err := json.Unmarshal([]byte(hadithData), &hadith)
    if err != nil {
        return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
    }

    // Check if Hadith already exists
    exists, err := hc.HadithExists(ctx, hadith.HadithID)
    if err != nil {
        return "", fmt.Errorf("failed to check if hadith exists: %v", err)
    }
    if exists {
        return "", fmt.Errorf("hadith with ID %s already exists", hadith.HadithID)
    }

    // Convert hadithData to []byte
    hadithDataBytes := []byte(hadithData)

    // Store Hadith in state
    err = ctx.GetStub().PutState(hadith.HadithID, hadithDataBytes)
    if err != nil {
        return "", fmt.Errorf("failed to add hadith: %v", err)
    }

    return ctx.GetStub().GetTxID(), nil
}


func (hc *HadithContract) UpdateHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
	cid := ctx.GetClientIdentity()
	scholarErr := cid.AssertAttributeValue("registrationType", "scholar")
	if scholarErr != nil {
		return "", fmt.Errorf("you are not authorized to perform this operation")
	}

	var hadith Hadith
    err := json.Unmarshal([]byte(hadithData), &hadith)
    if err != nil {
        return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
    }

	exists, err := hc.HadithExists(ctx, hadith.HadithID)
	if err != nil {
		return "", err
	}
	if exists {
		return "", fmt.Errorf("hadith with ID %s already exists", hadith.HadithID)
	}

	previousHadith, err := hc.GetHadithByID(ctx, hadith.PreviousHadithID)
	if err != nil {
		return "", err
	}
	if previousHadith.HadithStatus == "inprogress" {
		return "", fmt.Errorf("hadith with ID %s is in progress", hadith.PreviousHadithID)
	}

	err = ctx.GetStub().PutState(hadith.HadithID, []byte(hadithData))
	if err != nil {
		return "", fmt.Errorf("failed to update hadith: %v", err)
	}

	return ctx.GetStub().GetTxID(), nil
}

func (hc *HadithContract) HadithExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	hadithJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to get hadith: %v", err)
	}

	return hadithJSON != nil && len(hadithJSON) > 0, nil
}

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

// func (hc *HadithContract) DeleteHadith(ctx contractapi.TransactionContextInterface, id, deletedBy string, active string) (string, error) {

// 	cid := ctx.GetClientIdentity()
// 	scholarErr := cid.AssertAttributeValue("registrationType", "scholar")
// 	if scholarErr != nil {
// 		return "", fmt.Errorf("you are not authorized to perform this operation")
// 	}

//     hadith, err := hc.GetHadithByID(ctx, id)
// 	if err != nil {
// 		return "", err
// 	}
// 	// Debugging Output
// 	fmt.Printf("hadith.HadithStatus: %+v\n", hadith.HadithStatus)
// 	fmt.Printf("active: %+v\n", active)

// 	if hadith.PreviousHadithID != "" && active == "true" {
// 		return "", fmt.Errorf("operation failed: this operation is reserved for rejecting new hadith submissions")
// 	} else if hadith.HadithStatus == "active" && active == "true" {
// 		return "", fmt.Errorf("operation failed: the hadith is already active")
// 	}
//     fmt.Println("deletedBy:", deletedBy)
//     fmt.Println("id before:", id)
    
//     idBytes, err := json.Marshal(id)
//     fmt.Println("id after:", string(idBytes)) // Convert []byte to string for printing
//     if err != nil {
//         return "", fmt.Errorf("failed to marshal id metadata: %v", err)
//     }
    
//     deleteMetadata := DeleteMetadata{
//         HadithID:  string(idBytes), // Convert []byte to string
//         DeletedBy: deletedBy,
//     }

// 	deleteMetadataBytes, err := json.Marshal(deleteMetadata)
//     fmt.Println("deleteMetadataBytes:", deleteMetadataBytes)
// 	if err != nil {
// 		return "", fmt.Errorf("failed to marshal delete metadata: %v", err)
// 	}

// 	err = ctx.GetStub().PutState("delete_"+id, deleteMetadataBytes)
// 	if err != nil {
// 		return "", fmt.Errorf("failed to store delete metadata: %v", err)
// 	}

// 	err = ctx.GetStub().DelState(id)
// 	if err != nil {
// 		return "", fmt.Errorf("failed to delete hadith: %v", err)
// 	}

//     approvals, err := hc.QueryApprovalsByHadithId(ctx, id)
//     if err != nil {
//         return "", err
//     }
    
//     for _, approval := range approvals {
//         // Access the HadithID field using map syntax
//         hadithID, ok := approval["ID"].(string)
//         if !ok {
//             return "", fmt.Errorf("ID is not found or not a string in the approval record")
//         }
    
//         // Use the HadithID field to delete the state
//         fmt.Println("approval ID:", hadithID)
//         err := ctx.GetStub().DelState(hadithID)
//         if err != nil {
//             return "", fmt.Errorf("failed to delete approval with ID %s: %v", hadithID, err)
//         }
//     }

// 	return fmt.Sprintf("Hadith %s and its approvals have been deleted successfully", id), nil
// }

func (hc *HadithContract) DeleteHadith(ctx contractapi.TransactionContextInterface, id, deletedBy string, active string) (string, error) {

    cid := ctx.GetClientIdentity()
    scholarErr := cid.AssertAttributeValue("registrationType", "scholar")
    if scholarErr != nil {
        return "", fmt.Errorf("you are not authorized to perform this operation")
    }

    hadith, err := hc.GetHadithByID(ctx, id)
    if err != nil {
        return "", err
    }

    if hadith.PreviousHadithID != "" && active == "true" {
        return "", fmt.Errorf("operation failed: this operation is reserved for rejecting new hadith submissions")
    } else if hadith.HadithStatus == "active" && active == "true" {
        return "", fmt.Errorf("operation failed: the hadith is already active")
    }

    deleteMetadata := DeleteMetadata{
        HadithID:  id,
        DeletedBy: deletedBy,
    }

    deleteMetadataBytes, err := json.Marshal(deleteMetadata)
    if err != nil {
        return "", fmt.Errorf("failed to marshal delete metadata: %v", err)
    }

    err = ctx.GetStub().PutState("delete_"+id, deleteMetadataBytes)
    if err != nil {
        return "", fmt.Errorf("failed to store delete metadata: %v", err)
    }

    err = ctx.GetStub().DelState(id)
    if err != nil {
        return "", fmt.Errorf("failed to delete hadith: %v", err)
    }

    approvals, err := hc.QueryApprovalsByHadithId(ctx, id)
    if err != nil {
        return "", err
    }

    for _, approval := range approvals {
        hadithID, ok:= approval["Key"].(string)
        if !ok || hadithID == "" {
            fmt.Println("Skipping approval with empty or invalid ID:", approval)
            continue
        }

        fmt.Println("approval ID:", hadithID)
        err := ctx.GetStub().DelState(hadithID)
        if err != nil {
            return "", fmt.Errorf("failed to delete approval with ID %s: %v", hadithID, err)
        }
    }

    return fmt.Sprintf("Hadith %s and its approvals have been deleted successfully", id), nil
}
// func (hc *HadithContract) ApproveHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
//     // Parse the input Hadith data
// 	var hadith Hadith
// 	err := json.Unmarshal([]byte(hadithData), &hadith)
// 	if err != nil {
// 		return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
// 	}

//     hadithId := hadith.HadithID

    // Retrieve the client identity
	// cid := ctx.GetClientIdentity()
    // // Check if the client has the required attribute to perform this operation
	// scholarErr := cid.AssertAttributeValue("registrationType", "scholar")
	// if scholarErr != nil {
	// 	return "", fmt.Errorf("you are not authorized to perform this operation")
	// }

//     // If the Hadith status is "active", retrieve and update the Hadith status
//     if hadith.HadithStatus == "active" {
//         // Retrieve the Hadith by ID
//         hadithBytes, err := ctx.GetStub().GetState(hadithId)
//         if err != nil {
//             return "", fmt.Errorf("failed to get Hadith: %v", err)
//         }
//         if hadithBytes == nil {
//             return "", fmt.Errorf("hadith with ID %s does not exist", hadithId)
//         }

//         // Unmarshal the existing Hadith data
//         var existingHadith Hadith
//         err = json.Unmarshal(hadithBytes, &existingHadith)
//         if err != nil {
//             return "", fmt.Errorf("failed to unmarshal existing hadith data: %v", err)
//         }

//         // Update the Hadith status
//         existingHadith.HadithStatus = hadith.HadithStatus

//         // Store the updated Hadith back to the ledger
//         updatedHadithBytes, err := json.Marshal(existingHadith)
//         if err != nil {
//             return "", fmt.Errorf("failed to marshal updated hadith: %v", err)
//         }

//         err = ctx.GetStub().PutState(hadithId, updatedHadithBytes)
//         if err != nil {
//             return "", fmt.Errorf("failed to update hadith: %v", err)
//         }
//     }

//     // Remove the Hadith status from the Hadith data
//     hadith.HadithStatus = ""

//     // Marshal the Hadith data to store it
//     hadithBytes, err := json.Marshal(hadith)
//     if err != nil {
//         return "", fmt.Errorf("failed to marshal hadith: %v", err)
//     }

//     // Store the updated Hadith data in the ledger
//     err = ctx.GetStub().PutState(hadith.HadithID, hadithBytes)
//     if err != nil {
//         return "", fmt.Errorf("failed to put hadith: %v", err)
//     }

//     // Return the transaction ID
//     return ctx.GetStub().GetTxID(), nil
// }

// func (hc *HadithContract) ApproveHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
//     // Parse the input Hadith data
//     var hadith map[string]interface{}
//     if err := json.Unmarshal([]byte(hadithData), &hadith); err != nil {
//         return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
//     }

//     // Debugging: Print the parsed hadith data
//     fmt.Printf("Parsed Hadith Data: %+v\n", hadith)

//     hadithId, ok := hadith["hadithId"].(string)
//     if !ok {
//         return "", fmt.Errorf("hadithId is required and must be a string")
//     }

//     // Check if the client is a scholar
//     cid := ctx.GetClientIdentity()
//     if err := cid.AssertAttributeValue("registrationType", "scholar"); err != nil {
//         return "", fmt.Errorf("you are not authorized to perform this operation")
//     }

//     // If the Hadith status is "active", update the status of the existing Hadith
//     if hadith["hadithStatus"] == "active" {
//         // Retrieve the existing Hadith
//         hadithBuffer, err := ctx.GetStub().GetState(hadithId)
//         if err != nil {
//             return "", fmt.Errorf("failed to get hadith state: %v", err)
//         }
//         if hadithBuffer == nil {
//             return "", fmt.Errorf("hadith with ID %s does not exist", hadithId)
//         }

//         // Unmarshal the existing Hadith data
//         var existingHadith map[string]interface{}
//         if err := json.Unmarshal(hadithBuffer, &existingHadith); err != nil {
//             return "", fmt.Errorf("failed to unmarshal existing hadith: %v", err)
//         }

//         // Debugging: Print existing Hadith data before update
//         fmt.Printf("Existing Hadith Data Before Update: %+v\n", existingHadith)

//         // Update the Hadith status
//         existingHadith["hadithStatus"] = "active"

//         // Store the updated Hadith
//         existingHadithBytes, err := json.Marshal(existingHadith)
//         if err != nil {
//             return "", fmt.Errorf("failed to marshal updated hadith: %v", err)
//         }
//         if err := ctx.GetStub().PutState(hadithId, existingHadithBytes); err != nil {
//             return "", fmt.Errorf("failed to put updated hadith state: %v", err)
//         }

//         // Debugging: Print updated Hadith data
//         fmt.Printf("Updated Hadith Data: %s\n", string(existingHadithBytes))


//     }

//     // Remove the hadithStatus from hadith data before saving
//     delete(hadith, "hadithStatus")

//     // Save the updated Hadith data
//     hadithBytes, err := json.Marshal(hadith)
//     if err != nil {
//         return "", fmt.Errorf("failed to marshal hadith data: %v", err)
//     }
//     if err := ctx.GetStub().PutState(hadithId, hadithBytes); err != nil {
//         return "", fmt.Errorf("failed to put hadith state: %v", err)
//     }

//     // Log the transaction ID for debugging
//     txID := ctx.GetStub().GetTxID()
//     fmt.Printf("Transaction ID: %s\n", txID)

//     // Debugging: Print final Hadith data after save
//     finalHadithBuffer, err := ctx.GetStub().GetState(hadithId)
//     if err != nil {
//         return "", fmt.Errorf("failed to get final hadith state: %v", err)
//     }
//     var finalHadith map[string]interface{}
//     if err := json.Unmarshal(finalHadithBuffer, &finalHadith); err != nil {
//         return "", fmt.Errorf("failed to unmarshal final hadith: %v", err)
//     }
//     fmt.Printf("Final Hadith Data: %+v\n", finalHadith)

//     return txID, nil
// }
// func (hc *HadithContract) ApproveHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
//     // Parse the input Hadith data
//     var hadith map[string]interface{}
//     if err := json.Unmarshal([]byte(hadithData), &hadith); err != nil {
//         return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
//     }

//     // Debugging: Print the parsed hadith data
//     fmt.Printf("Parsed Hadith Data: %+v\n", hadith)

//     hadithId, ok := hadith["hadithId"].(string)
//     if !ok {
//         return "", fmt.Errorf("hadithId is required and must be a string")
//     }
//     id, ok := hadith["id"].(string)
//     if !ok {
//         return "", fmt.Errorf("id is required and must be a string")
//     }
//     // Check if the client is a scholar
//     cid := ctx.GetClientIdentity()
//     if err := cid.AssertAttributeValue("registrationType", "scholar"); err != nil {
//         return "", fmt.Errorf("you are not authorized to perform this operation")
//     }

//     // Retrieve the existing Hadith if the status is "active"
//     var existingHadith map[string]interface{}
//     if hadith["hadithStatus"] == "active" {
//         hadithBuffer, err := ctx.GetStub().GetState(hadithId)
//         if err != nil {
//             return "", fmt.Errorf("failed to get hadith state: %v", err)
//         }
//         if hadithBuffer == nil {
//             return "", fmt.Errorf("hadith with ID %s does not exist", hadithId)
//         }

//         // Unmarshal the existing Hadith data
//         if err := json.Unmarshal(hadithBuffer, &existingHadith); err != nil {
//             return "", fmt.Errorf("failed to unmarshal existing hadith: %v", err)
//         }
//         // Update the Hadith status and merge other fields
//         existingHadith["hadithStatus"] = "active"
//         for key, value := range hadith {
//             existingHadith[key] = value
//         }

//         // Store the updated Hadith data
//         updatedHadithBytes, err := json.Marshal(existingHadith)
//         if err != nil {
//             return "", fmt.Errorf("failed to marshal updated hadith: %v", err)
//         }
//         if err := ctx.GetStub().PutState(hadithId, updatedHadithBytes); err != nil {
//             return "", fmt.Errorf("failed to put updated hadith state: %v", err)
//         }

//         // Debugging: Print updated Hadith data
//         fmt.Printf("Updated Hadith Data: %s\n", string(updatedHadithBytes))

//     } else {
//         // If not updating status, save the new Hadith data directly
//         // Remove the hadithStatus from hadith data before saving
//         delete(hadith, "hadithStatus")

//         // Save the new Hadith data
//         hadithBytes, err := json.Marshal(hadith)
//         if err != nil {
//             return "", fmt.Errorf("failed to marshal hadith data: %v", err)
//         }
//         if err := ctx.GetStub().PutState(hadith.id, hadithBytes); err != nil {
//             return "", fmt.Errorf("failed to put hadith state: %v", err)
//         }
//     }

//     // Log the transaction ID for debugging
//     txID := ctx.GetStub().GetTxID()
//     fmt.Printf("Transaction ID: %s\n", txID)

//     // Debugging: Print final Hadith data after save
//     finalHadithBuffer, err := ctx.GetStub().GetState(hadithId)
//     if err != nil {
//         return "", fmt.Errorf("failed to get final hadith state: %v", err)
//     }
//     var finalHadith map[string]interface{}
//     if err := json.Unmarshal(finalHadithBuffer, &finalHadith); err != nil {
//         return "", fmt.Errorf("failed to unmarshal final hadith: %v", err)
//     }
//     fmt.Printf("Final Hadith Data: %+v\n", finalHadith)

//     return txID, nil
// }

func (hc *HadithContract) ApproveHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
    // Parse the input Hadith data
    var hadith map[string]interface{}
    if err := json.Unmarshal([]byte(hadithData), &hadith); err != nil {
        return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
    }
    hadithId := hadith["hadithId"].(string)
    id := hadith["id"].(string)

    // Check if the client is a scholar
    cid := ctx.GetClientIdentity()
    if err := cid.AssertAttributeValue("registrationType", "scholar"); err != nil {
        return "", fmt.Errorf("you are not authorized to perform this operation")
    }
    // Retrieve the existing Hadith if the status is "active"
    var existingHadith map[string]interface{}
    // Retrieve the existing Hadith if the status is "active"
    if hadith["hadithStatus"] == "active" { 
        hadithBuffer, err := ctx.GetStub().GetState(hadithId)
        if err != nil {
            return "", fmt.Errorf("failed to get hadith state: %v", err)
        }
        if hadithBuffer == nil {
            return "", fmt.Errorf("hadith with ID %s does not exist", hadithId)
        }

        // Unmarshal the existing Hadith data
        if err := json.Unmarshal(hadithBuffer, &existingHadith); err != nil {
            return "", fmt.Errorf("failed to unmarshal existing hadith: %v", err)
        }
        // Update the Hadith status 
        existingHadith["hadithStatus"] = "active"

        // Store the updated Hadith data
        updatedHadithBytes, err := json.Marshal(existingHadith)
        if err != nil {
            return "", fmt.Errorf("failed to marshal updated hadith: %v", err)
        }
        if err := ctx.GetStub().PutState(hadithId, updatedHadithBytes); err != nil {
            return "", fmt.Errorf("failed to put updated hadith state: %v", err)
        }

    }

    // Remove the hadithStatus from hadith before saving
    delete(hadith, "hadithStatus")

    // Save the Hadith data
    hadithBytes, err := json.Marshal(hadith)
    if err != nil {
        return "", fmt.Errorf("failed to marshal hadith data: %v", err)
    }
    if err := ctx.GetStub().PutState(id, hadithBytes); err != nil {
        return "", fmt.Errorf("failed to put hadith state: %v", err)
    }

    // Log the transaction ID for debugging
    txID := ctx.GetStub().GetTxID()
    fmt.Printf("Transaction ID: %s\n", txID)

    return txID, nil
}

// updateHadithState marshals and stores the Hadith data in the ledger
func (hc *HadithContract) updateHadithState(ctx contractapi.TransactionContextInterface, hadithId string, hadith map[string]interface{}) error {
    hadithBytes, err := json.Marshal(hadith)
    if err != nil {
        return fmt.Errorf("failed to marshal hadith data: %v", err)
    }

    if err := ctx.GetStub().PutState(hadithId, hadithBytes); err != nil {
        return fmt.Errorf("failed to put hadith state: %v", err)
    }

    return nil
}

func (hc *HadithContract) ValidateApprovals(ctx contractapi.TransactionContextInterface, hadithId, userStr string) (string, error) {
	
	cid := ctx.GetClientIdentity()
	scholarErr := cid.AssertAttributeValue("registrationType", "scholar")
	if scholarErr != nil {
		return "", fmt.Errorf("you are not authorized to perform this operation")
	}

	hadith, err := hc.GetHadithByID(ctx, hadithId)
	if err != nil {
		return "", err
	}

	if hadith.PreviousHadithID != "" {
		return "", fmt.Errorf("operation failed: This operation is intended for approving new Hadith submissions only.")
	} else if hadith.HadithStatus == "active" {
		return "", fmt.Errorf("operation failed: The Hadith is already active.")
	}

	var user map[string]string
	err = json.Unmarshal([]byte(userStr), &user)
	if err != nil {
		return "", fmt.Errorf("failed to unmarshal user: %v", err)
	}

	queryString := fmt.Sprintf(`{"selector":{"hadithId":"%s"}}`, hadithId)
	iterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return "", fmt.Errorf("failed to query hadith approvals: %v", err)
	}
	defer iterator.Close()

	scholarCount := 0

	for iterator.HasNext() {
		result, err := iterator.Next()
		if err != nil {
			return "", fmt.Errorf("failed to iterate approvals: %v", err)
		}
	
		var approval Hadith
		err = json.Unmarshal(result.Value, &approval)
		if err != nil {
			return "", fmt.Errorf("failed to unmarshal approval: %v", err)
		}
	
		// Convert OrgID to string to ensure the comparison is valid
		orgIDStr := fmt.Sprintf("%v", approval.OrgID)

		// Perform the comparison
		if approval.RegistrationType == user["registrationType"] && orgIDStr == user["orgId"] {
			return "", fmt.Errorf("This Hadith has already been marked as approved by your institution.")
		}
	
		if approval.RegistrationType == "scholar" {
			scholarCount++
		}
	}
	

	if scholarCount > 0 {
		return AGREEMENT_STATUS.ACTIVE, nil
	}

	return AGREEMENT_STATUS.INPROGRESS, nil
}


// func (hc *HadithContract) ApproveAndRejectForUpdateHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
//     // Parse the input Hadith data
//     var hadith Hadith
//     err := json.Unmarshal([]byte(hadithData), &hadith)
//     if err != nil {
//         return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
//     }

//     // Retrieve the client identity
//     cid := ctx.GetClientIdentity()
//     // Check if the client has the required attribute to perform this operation
//     if err := cid.AssertAttributeValue("registrationType", "scholar"); err != nil {
//         return "", fmt.Errorf("you are not authorized to perform this operation")
//     }

//     // Destructure fields from the Hadith struct
// 	hadithId := hadith.HadithID
//     hadithStatus := hadith.HadithStatus
//     id := hadith.HadithID
//     createBy := hadith.CreatedBy

//     if hadithStatus == "rejected" {
//         // Delete the hadith directly if it is rejected
//         _, err := hc.DeleteHadith(ctx, hadithId, createBy, "false")
//         if err != nil {
//             return "", fmt.Errorf("failed to delete rejected hadith: %v", err)
//         }
//         return ctx.GetStub().GetTxID(), nil
//     }

//     if hadithStatus == "active" {
//         // Retrieve the Hadith to update its status
//         hadithBytes, err := ctx.GetStub().GetState(hadithId)
//         if err != nil {
//             return "", fmt.Errorf("failed to get Hadith: %v", err)
//         }
//         if hadithBytes == nil {
//             return "", fmt.Errorf("hadith with ID %s does not exist", hadithId)
//         }

//         var existingHadith Hadith
//         err = json.Unmarshal(hadithBytes, &existingHadith)
//         if err != nil {
//             return "", fmt.Errorf("failed to unmarshal existing hadith data: %v", err)
//         }

//         // Update the Hadith status
//         existingHadith.HadithStatus = hadithStatus

//         // Store the updated Hadith
//         updatedHadithBytes, err := json.Marshal(existingHadith)
//         if err != nil {
//             return "", fmt.Errorf("failed to marshal updated hadith: %v", err)
//         }

//         err = ctx.GetStub().PutState(hadithId, updatedHadithBytes)
//         if err != nil {
//             return "", fmt.Errorf("failed to update hadith: %v", err)
//         }

//         // Delete the previous Hadith if it exists
//         _, err = hc.DeleteHadith(ctx, existingHadith.PreviousHadithID, existingHadith.CreatedBy, "false")
//         if err != nil {
//             return "", fmt.Errorf("failed to delete previous hadith: %v", err)
//         }
//     }

//     // Remove hadithStatus from hadith before storing approval/rejection record
//     hadith.HadithStatus = ""

//     // Store the approval/rejection record
//     hadithBytes, err := json.Marshal(hadith)
//     if err != nil {
//         return "", fmt.Errorf("failed to marshal hadith: %v", err)
//     }

//     err = ctx.GetStub().PutState(id, hadithBytes)
//     if err != nil {
//         return "", fmt.Errorf("failed to put hadith: %v", err)
//     }

//     // Return the transaction ID
//     return ctx.GetStub().GetTxID(), nil
// }

func (hc *HadithContract) ApproveAndRejectForUpdateHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
        // Check if the client is a scholar
     cid := ctx.GetClientIdentity()
      if err := cid.AssertAttributeValue("registrationType", "scholar"); err != nil {
          return "", fmt.Errorf("you are not authorized to perform this operation")
       }

    // Parse the input Hadith data
    var hadith map[string]interface{}
    if err := json.Unmarshal([]byte(hadithData), &hadith); err != nil {
        return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
    }
    hadithId := hadith["hadithId"].(string)
    id := hadith["id"].(string)
    createBy := hadith["createBy"].(string)
    hadithStatus := hadith["hadithStatus"].(string)

    fmt.Printf("hadith aaa hadithStatus: %s\n", hadith["hadithStatus"])
    fmt.Printf("hadith bbb hadithStatus: %s\n", hadithStatus)

    if hadithStatus == "rejected" {
     // Delete the hadith directly if it is rejected
      _, err := hc.DeleteHadith(ctx, hadithId, createBy, "false")
       if err != nil {
        return "", fmt.Errorf("failed to delete rejected hadith: %v", err)
        }
    return ctx.GetStub().GetTxID(), nil
    }

    // Retrieve the existing Hadith if the status is "active"
    var existingHadith map[string]interface{}
    if hadithStatus == "active" {
        hadithBuffer, err := ctx.GetStub().GetState(hadithId)
        if err != nil {
            return "", fmt.Errorf("failed to get hadith state: %v", err)
        }
        if hadithBuffer == nil {
            return "", fmt.Errorf("hadith with ID %s does not exist", hadithId)
        }

        // Unmarshal the existing Hadith data
        if err := json.Unmarshal(hadithBuffer, &existingHadith); err != nil {
            return "", fmt.Errorf("failed to unmarshal existing hadith: %v", err)
        }

        // Update the Hadith status
        existingHadith["hadithStatus"] = "active"
        fmt.Printf("hadith aaa xistingHadith hadithStatus: %s\n",  existingHadith["hadithStatus"])

        // Get values for deletion
        previousHadithId := existingHadith["previousHadithId"].(string)
        createBy := existingHadith["createBy"].(string)

        // Call DeleteHadith with the correct type assertions
 
        _, err = hc.DeleteHadith(ctx, previousHadithId, createBy, "false")
         if err != nil {
                    return "", fmt.Errorf("failed to delete previous hadith: %v", err)
                }

        // Store the updated Hadith data
        updatedHadithBytes, err := json.Marshal(existingHadith)
        if err != nil {
            return "", fmt.Errorf("failed to marshal updated hadith: %v", err)
        }
        if err := ctx.GetStub().PutState(hadithId, updatedHadithBytes); err != nil {
            return "", fmt.Errorf("failed to put updated hadith state: %v", err)
        }
    }

    // Remove the hadithStatus from hadith before saving
    delete(hadith, "hadithStatus")

    // Save the Hadith data
    hadithBytes, err := json.Marshal(hadith)
    if err != nil {
        return "", fmt.Errorf("failed to marshal hadith data: %v", err)
    }
    if err := ctx.GetStub().PutState(id, hadithBytes); err != nil {
        return "", fmt.Errorf("failed to put hadith state: %v", err)
    }

    // Log the transaction ID for debugging
    txID := ctx.GetStub().GetTxID()
    fmt.Printf("Transaction ID: %s\n", txID)

    return txID, nil
}
// func (hc *HadithContract) ValidateHadithUpdateApprovalAndRejectionl(ctx contractapi.TransactionContextInterface, hadithId, statusStr, userStr string) (string, error) {
//     // Retrieve client identity
//     cid := ctx.GetClientIdentity()
//     // Check if the client has the required attribute to perform this operation
//     if err := cid.AssertAttributeValue("registrationType", "scholar"); err != nil {
//         return "", fmt.Errorf("you are not authorized to perform this operation")
//     }

//     // Retrieve the Hadith by ID
//     hadith, err := hc.GetHadithByID(ctx, hadithId)
//     if err != nil {
//         return "", err
//     }

//     // Validate the Hadith state
//     if hadith.PreviousHadithID == "" {
//         return "", fmt.Errorf("operation failed: This operation is intended for updates to an existing Hadith.")
//     } else if hadith.HadithStatus == "active" {
//         return "", fmt.Errorf("operation failed: The Hadith is already active.")
//     }

//     // Unmarshal user and status data
//     var user map[string]string
//     if err := json.Unmarshal([]byte(userStr), &user); err != nil {
//         return "", fmt.Errorf("failed to unmarshal user: %v", err)
//     }

//     var status map[string]string
//     if err := json.Unmarshal([]byte(statusStr), &status); err != nil {
//         return "", fmt.Errorf("failed to unmarshal status: %v", err)
//     }

//     // Query for Hadith approvals
//     queryString := fmt.Sprintf(`{"selector":{"hadithId":"%s"}}`, hadithId)
//     iterator, err := ctx.GetStub().GetQueryResult(queryString)
//     if err != nil {
//         return "", fmt.Errorf("failed to query hadith approvals: %v", err)
//     }
//     defer iterator.Close()

//     approvalCount := 0
//     rejectionCount := 0

//     // Iterate through the query results
//     for iterator.HasNext() {
//         result, err := iterator.Next()
//         if err != nil {
//             return "", fmt.Errorf("failed to iterate approvals: %v", err)
//         }

//         var approval Hadith
//         if err := json.Unmarshal(result.Value, &approval); err != nil {
//             return "", fmt.Errorf("failed to unmarshal approval: %v", err)
//         }

//         // Check if the user is trying to approve or reject their own Hadith
//         if approval.CreatedBy == hadith.CreatedBy {
//             return "", fmt.Errorf("You cannot approve or reject your own Hadith.")
//         }

//         // Check if the Hadith has already been marked as approved by the user's institution
//         if approval.RegistrationType == user["registrationType"] && approval.OrgID == user["orgId"] {
//             return "", fmt.Errorf("This Hadith has already been marked as approved by your institution.")
//         }

//         // Count the number of approvals and rejections
//         if approval.RegistrationType == "scholar" {
//             if status["approvalStatus"] == "approved" {
//                 approvalCount++
//             } else if status["approvalStatus"] == "rejected" {
//                 rejectionCount++
//             }
//         }
//     }

//     // Determine the status based on approval and rejection counts
//     if rejectionCount > 0 {
//         return AGREEMENT_STATUS.REJECTED, nil
//     }

//     if approvalCount > 0 {
//         return AGREEMENT_STATUS.ACTIVE, nil
//     }

//     return AGREEMENT_STATUS.INPROGRESS, nil
// }


// func (hc *HadithContract) ValidateHadithUpdateApprovalAndRejectionbb(ctx contractapi.TransactionContextInterface, hadithId, statusStr, userStr string) (string, error) {
//     // Retrieve client identity
//     cid := ctx.GetClientIdentity()
//     if err := cid.AssertAttributeValue("registrationType", "scholar"); err != nil {
//         return "", fmt.Errorf("you are not authorized to perform this operation")
//     }

//     // Retrieve the Hadith by ID
//     hadith, err := hc.GetHadithByID(ctx, hadithId)
//     if err != nil {
//         return "", err
//     }

//     // Validate the Hadith state
//     if hadith.PreviousHadithID == "" {
//         return "", fmt.Errorf("operation failed: This operation is intended for updates to an existing Hadith.")
//     } else if hadith.HadithStatus == "active" {
//         return "", fmt.Errorf("operation failed: The Hadith is already active.")
//     }

//     // Unmarshal user and status data
//     var user map[string]interface{}
//     if err := json.Unmarshal([]byte(userStr), &user); err != nil {
//         return "", fmt.Errorf("failed to unmarshal user: %v", err)
//     }

//     var status map[string]interface{}
//     if err := json.Unmarshal([]byte(statusStr), &status); err != nil {
//         return "", fmt.Errorf("failed to unmarshal status: %v", err)
//     }

//     // Extract relevant fields from user and status
//     email := user["email"].(string)
//     userOrgId := user["orgId"].(string)
//     userStatus := status["status"].(string)

//     // Query for Hadith approvals
// 	queryString := fmt.Sprintf(`{"selector":{"hadithId":"%s"}}`, hadithId)
// 	iterator, err := ctx.GetStub().GetQueryResult(queryString)
//     if err != nil {
//         return "", fmt.Errorf("failed to query hadith approvals: %v", err)
//     }
//     defer iterator.Close()

//     // Initialize counts based on userStatus
//     approvalCount := 0
//     rejectionCount := 0
//     if userStatus == "approved" {
//         approvalCount = 1
//     } else if userStatus == "rejected" {
//         rejectionCount = 1
//     }

//     for iterator.HasNext() {
//         result, err := iterator.Next()
//         if err != nil {
//             return "", fmt.Errorf("failed to iterate approvals: %v", err)
//         }

//         var approval map[string]interface{}
//         if err := json.Unmarshal(result.Value, &approval); err != nil {
//             return "", fmt.Errorf("failed to unmarshal approval: %v", err)
//         }

//         createBy, _ := approval["CreateBy"].(string)
//         orgId, _ := approval["OrgId"].(string)
//         approvalStatus, _ := approval["Status"].(string)

//         // Debug output for values
//         fmt.Printf("createBy aaa: %s, email aaa: %s\n", createBy, email)

//         // Check if the user is trying to approve or reject their own Hadith
//         if createBy == email {
//             return "", fmt.Errorf("You cannot approve or reject your own Hadith.")
//         }

//         // Check if the Hadith has already been marked as approved/rejected by the user's institution
//         if orgId == userOrgId {
//             if approvalStatus == "approved" && userStatus == "approved" {
//                 return "", fmt.Errorf("A scholar from your organization has already approved this Hadith.")
//             } else if approvalStatus == "rejected" && userStatus == "rejected" {
//                 return "", fmt.Errorf("A scholar from your organization has already rejected this Hadith.")
//             }
//         }

//         // Count the number of approvals and rejections
//         if approvalStatus == "approved" {
//             approvalCount++
//         } else if approvalStatus == "rejected" {
//             rejectionCount++
//         }

//         // Early exit conditions to avoid unnecessary iterations
//         if approvalCount >= 2 {
//             return AGREEMENT_STATUS.ACTIVE, nil
//         } else if rejectionCount >= 2 {
//             return AGREEMENT_STATUS.REJECTED, nil
//         }
//     }

//     return AGREEMENT_STATUS.INPROGRESS, nil
// }
func (hc *HadithContract) ValidateHadithUpdateApprovalAndRejection(ctx contractapi.TransactionContextInterface, hadithId, statusStr, userStr string) (string, error) {
    // Retrieve client identity
    cid := ctx.GetClientIdentity()
    if err := cid.AssertAttributeValue("registrationType", "scholar"); err != nil {
        return "", fmt.Errorf("you are not authorized to perform this operation")
    }

    // Retrieve the Hadith by ID
    hadith, err := hc.GetHadithByID(ctx, hadithId)
    if err != nil {
        return "", err
    }

    // Validate the Hadith state
    if hadith.PreviousHadithID == "" {
        return "", fmt.Errorf("operation failed: This operation is intended for updates to an existing Hadith.")
    } else if hadith.HadithStatus == "active" {
        return "", fmt.Errorf("operation failed: The Hadith is already active.")
    }

    // Unmarshal user and status data
    var user map[string]interface{}
    if err := json.Unmarshal([]byte(userStr), &user); err != nil {
        return "", fmt.Errorf("failed to unmarshal user: %v", err)
    }

    var status map[string]interface{}
    if err := json.Unmarshal([]byte(statusStr), &status); err != nil {
        return "", fmt.Errorf("failed to unmarshal status: %v", err)
    }

    // Extract relevant fields from user and status
    email := user["email"].(string)
    userOrgId := user["orgId"].(string)
    userStatus := status["status"].(string)

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

        // Debug output for values
        fmt.Printf("createBy aaa: %s, email aaa: %s\n", createBy, email)

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

// func (hc *HadithContract) QueryApprovalsByHadithId(ctx contractapi.TransactionContextInterface, hadithId string) ([]Hadith, error) {
//     // Create the query string
//     queryString := fmt.Sprintf(`{"selector":{"hadithId":"%s"}}`, hadithId)

//     // Execute the query
//     resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
//     if err != nil {
//         return nil, fmt.Errorf("failed to query approvals by HadithId: %v", err)
//     }
//     defer resultsIterator.Close()

//     // Retrieve all results
//     var allResults []Hadith
//     for resultsIterator.HasNext() {
//         result, err := resultsIterator.Next()
//         if err != nil {
//             return nil, fmt.Errorf("failed to iterate results: %v", err)
//         }

//         var hadith Hadith
//         err = json.Unmarshal(result.Value, &hadith)
//         if err != nil {
//             return nil, fmt.Errorf("failed to unmarshal result value: %v", err)
//         }

//         allResults = append(allResults, hadith)
//     }

//     return allResults, nil
// }


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

// func (hc *HadithContract) getAllResultsFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]map[string]interface{}, error) {
// 	var results []map[string]interface{}

// 	for resultsIterator.HasNext() {
// 		queryResponse, err := resultsIterator.Next()
// 		if err != nil {
// 			return nil, fmt.Errorf("failed to get next result: %v", err)
// 		}
//         // Log the raw JSON response
//         fmt.Println("Raw Query Response:", string(queryResponse.Value))

// 		var hadith HadithRecord
// 		if err := json.Unmarshal(queryResponse.Value, &hadith); err != nil {
// 			fmt.Printf("Error unmarshalling: %v\n", err)
// 			continue
// 		}
//         // Log the populated hadith struct
//         fmt.Printf("Populated Hadith: %+v\n", hadith)

// 		record := map[string]interface{}{
// 			"Hadith":            hadith.Hadith,
// 			"ReportedBy":        hadith.ReportedBy,
// 			"Status":            hadith.Status.Status,
// 			"CreateAt":          hadith.CreateAt,
// 			"CreateBy":          hadith.CreateBy,
// 			"HadithId":          hadith.HadithId,
// 			"HadithStatus":      hadith.HadithStatus,
// 			"PageOrNumber":      hadith.PageOrNumber,
// 			"RulingOfTheReported": hadith.RulingOfTheReported,
// 			"Source":            hadith.Source,
// 			"TheFirstNarrator":  hadith.TheFirstNarrator,
// 			"Document":          hadith.Document,
// 			"ID":                hadith.ID,
// 			"OrgId":             hadith.OrgId,
// 			"RegistrationType":  hadith.RegistrationType,
// 		}

// 		fmt.Printf("Fetched record: %+v\n", record)
// 		results = append(results, record)
// 	}

// 	return results, nil
// }
func (hc *HadithContract) getAllResultsFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next result: %v", err)
		}

		// Log the raw JSON response
		fmt.Println("Raw Query Response:", string(queryResponse.Value))

		var hadith HadithRecord
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

		record := map[string]interface{}{
			"Hadith":             hadith.Hadith,
			"ReportedBy":         hadith.ReportedBy,
			"Status":             hadith.Status.Status,
			"CreateAt":           hadith.CreateAt,
			"CreateBy":           hadith.CreateBy,
			"HadithId":           hadith.HadithId,
			"HadithStatus":       hadith.HadithStatus,
			"PageOrNumber":       hadith.PageOrNumber,
			"RulingOfTheReported": hadith.RulingOfTheReported,
			"Source":             hadith.Source,
			"TheFirstNarrator":   hadith.TheFirstNarrator,
			"Document":           hadith.Document,
			"ID":                 hadith.ID,
			"OrgId":              hadith.OrgId,
			"RegistrationType":   hadith.RegistrationType,
		}

		fmt.Printf("Fetched record: %+v\n", record)
		results = append(results, record)
	}

	return results, nil
}

// GetHadithHistory returns the history and approval results for a Hadith ID
// func (hc *HadithContract) GetHadithHistory(ctx contractapi.TransactionContextInterface, id string) (map[string]interface{}, error) {
// 	history, err := hc.getHistoryById(ctx, id)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get history by ID: %v", err)
// 	}

// 	approvalResults, err := hc.QueryApprovalsByHadithId(ctx, id)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to query approvals by HadithId: %v", err)
// 	}

// 	result := map[string]interface{}{
// 		"results":         history,
// 		"approvalResults": approvalResults,
// 	}
// 	return result, nil
// }

func (hc *HadithContract) GetHadithHistory(ctx contractapi.TransactionContextInterface, id string) (map[string]interface{}, error) {
	history, err := hc.getHistoryById(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get history by ID: %v", err)
	}

	approvalResults, err := hc.QueryApprovalsByHadithId(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query approvals by HadithId: %v", err)
	}

	// Debugging Output
	fmt.Printf("History: %+v\n", history)
	fmt.Printf("Approvals: %+v\n", approvalResults)

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
        // Log raw response
        fmt.Printf("Raw History Response: %+v\n", response)

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
        // Log processed record
        fmt.Printf("Processed History Record: %+v\n", record)
		allResults = append(allResults, record)
	}
	return allResults, nil
}



// GetAllResults processes an iterator and returns all results as a list of maps
// func (hc *HadithContract) getAllResults(ctx contractapi.TransactionContextInterface, iterator shim.StateQueryIteratorInterface, isHistory bool) ([]map[string]interface{}, error) {
// 	var allResults []map[string]interface{}

// 	for iterator.HasNext() {
// 		queryResponse, err := iterator.Next()
// 		if err != nil {
// 			return nil, fmt.Errorf("failed to get next item from iterator: %v", err)
// 		}

// 		var jsonRes map[string]interface{}

// 		if isHistory {
// 			jsonRes = map[string]interface{}{
// 				"txId":      queryResponse.TxId,
// 				"Timestamp": queryResponse.Timestamp,
// 				"IsDelete":  queryResponse.IsDelete,
// 			}

// 			if queryResponse.IsDelete {
// 				jsonRes["IsDelete"] = "true"
// 			} else {
// 				jsonRes["IsDelete"] = "false"
// 			}

// 			var value interface{}
// 			if err := json.Unmarshal(queryResponse.Value, &value); err != nil {
// 				jsonRes["Value"] = string(queryResponse.Value)
// 			} else {
// 				jsonRes["Value"] = value
// 			}
// 		} else {
// 			jsonRes = map[string]interface{}{
// 				"Key": queryResponse.Key,
// 			}

// 			var record interface{}
// 			if err := json.Unmarshal(queryResponse.Value, &record); err != nil {
// 				jsonRes["Record"] = string(queryResponse.Value)
// 			} else {
// 				jsonRes["Record"] = record
// 			}
// 		}

// 		allResults = append(allResults, jsonRes)
// 	}

// 	if err := iterator.Close(); err != nil {
// 		return nil, fmt.Errorf("failed to close iterator: %v", err)
// 	}

// 	fmt.Printf("allResults: %v\n", allResults)
// 	return allResults, nil
// }




// func (hc *HadithContract) GetHadithHistory(ctx contractapi.TransactionContextInterface, id string) (map[string]interface{}, error) {
// 	results, err := hc.GetHistoryById(ctx, id)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get history: %v", err)
// 	}

// 	approvalResults, err := hc.QueryApprovalsByHadithId(ctx, id)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to query approvals: %v", err)
// 	}

// 	return map[string]interface{}{
// 		"success":         true,
// 		"message":         "Hadith history fetched successfully",
// 		"status":          200,
// 		"timestamp":       time.Now().UTC().Format(time.RFC3339),
// 		"payload": map[string]interface{}{
// 			"hadithHistory": results,
// 			"approvals":    approvalResults,
// 		},
// 	}, nil
// }

// func (hc *HadithContract) GetHistoryById(ctx contractapi.TransactionContextInterface, id string) ([]JSONResult, error) {
// 	iterator, err := ctx.GetStub().GetHistoryForKey(id)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get history for key %s: %v", id, err)
// 	}
// 	defer iterator.Close()

// 	var allResults []JSONResult

// 	for iterator.HasNext() {
// 		res, err := iterator.Next()
// 		if err != nil {
// 			return nil, fmt.Errorf("failed to iterate results: %v", err)
// 		}

// 		fmt.Printf("Processing transaction: %s, IsDelete: %v\n", res.TxId, res.IsDelete) // Debug log

// 		var action, deletedBy string
// 		var value interface{}
// 		isDelete := res.IsDelete

// 		if isDelete {
// 			action = "DELETED"
// 			deleteMetadataKey := fmt.Sprintf("delete_%s", id)
// 			deleteMetadataBytes, err := ctx.GetStub().GetState(deleteMetadataKey)
// 			if err == nil && len(deleteMetadataBytes) > 0 {
// 				var deleteMetadata struct {
// 					DeletedBy string `json:"deletedBy"`
// 				}
// 				json.Unmarshal(deleteMetadataBytes, &deleteMetadata)
// 				deletedBy = deleteMetadata.DeletedBy
// 			} else {
// 				deletedBy = "Unknown"
// 			}
// 			value = nil
// 		} else {
// 			json.Unmarshal(res.Value, &value)
// 			if valueData, ok := value.(map[string]interface{}); ok {
// 				if status, exists := valueData["hadithStatus"]; exists && status == "inprogress" {
// 					action = "CREATED"
// 				} else {
// 					action = "UPDATED"
// 				}
// 			}
// 		}

// 		timestamp := time.Unix(res.Timestamp.Seconds, int64(res.Timestamp.Nanos)).UTC().Format(time.RFC3339)
// 		allResults = append(allResults, JSONResult{
// 			TxId:      res.TxId,
// 			Timestamp: timestamp,
// 			IsDelete:  isDelete,
// 			Value:     value,
// 			DeletedBy: deletedBy,
// 			Action:    action,
// 		})

// 		// Log the value for further analysis
// 		fmt.Printf("Transaction Value: %+v\n", value)
// 	}

// 	fmt.Printf("Total results: %d\n", len(allResults)) // Debug log
// 	return allResults, nil
// }


// GetAllResults processes an iterator and returns all results as a list of maps
func (hc *HadithContract) GetAllResults(ctx contractapi.TransactionContextInterface, isHistory bool, key string) ([]JSONResult, error) {
	stub := ctx.GetStub()
	var iterator shim.StateQueryIteratorInterface
	var err error

	// Obtain the iterator based on whether it's a history or state query
	if isHistory {
		// Use history iterator
		historyIterator, err := stub.GetHistoryForKey(key)
		if err != nil {
			return nil, fmt.Errorf("failed to get history iterator: %v", err)
		}
		defer historyIterator.Close()

		var allResults []JSONResult

		for historyIterator.HasNext() {
			historyRes, err := historyIterator.Next()
			if err != nil {
				return nil, fmt.Errorf("failed to get next history item: %v", err)
			}

			var jsonRes JSONResult
			jsonRes.TxId = historyRes.TxId
			// jsonRes.Timestamp = time.Unix(historyRes.Timestamp.Seconds, int64(historyRes.Timestamp.Nanos)).UTC()
            jsonRes.Timestamp = time.Unix(historyRes.Timestamp.Seconds, int64(historyRes.Timestamp.Nanos)).UTC().Format(time.RFC3339)
			jsonRes.IsDelete = historyRes.IsDelete

			if err := json.Unmarshal(historyRes.Value, &jsonRes.Value); err != nil {
				fmt.Printf("failed to unmarshal history value: %v\n", err)
				jsonRes.Value = string(historyRes.Value)
			}

			allResults = append(allResults, jsonRes)
		}

		return allResults, nil
	} else {
		// Use state iterator
		iterator, err = stub.GetStateByRange("", "")
		if err != nil {
			return nil, fmt.Errorf("failed to get state iterator: %v", err)
		}
		defer iterator.Close()

		var allResults []JSONResult

		for iterator.HasNext() {
			kvRes, err := iterator.Next()
			if err != nil {
				return nil, fmt.Errorf("failed to get next state item: %v", err)
			}

			var jsonRes JSONResult
			jsonRes.Key = kvRes.Key

			if err := json.Unmarshal(kvRes.Value, &jsonRes.Record); err != nil {
				fmt.Printf("failed to unmarshal record value: %v\n", err)
				jsonRes.Record = string(kvRes.Value)
			}

			allResults = append(allResults, jsonRes)
		}

		return allResults, nil
	}
}

// GetDataWithPagination retrieves data with pagination using a query string
// func (hc *HadithContract) GetDataWithPagination(ctx contractapi.TransactionContextInterface, queryString string, pageSize int32, bookmark string) (map[string]interface{}, error) {
// 	iterator, metadata, err := ctx.GetStub().GetQueryResultWithPagination(queryString, pageSize, bookmark)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get query result with pagination: %v", err)
// 	}
// 	defer iterator.Close()


// 	results, err := hc.GetAllResults(ctx, false, "") 
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get all results: %v", err)
// 	}

// 	finalData := map[string]interface{}{
// 		"data": results,
// 		"metadata": map[string]interface{}{
// 			"RecordsCount": metadata.FetchedRecordsCount,
// 			"Bookmark":     metadata.Bookmark,
// 		},
// 	}
// 	return finalData, nil
// }
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