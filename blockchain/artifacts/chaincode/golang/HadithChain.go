package main

import (
    "encoding/json"
    "fmt"

    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// HadithContract provides functions for managing a Hadith
type HadithContract struct {
    contractapi.Contract
}

// Hadith represents the structure of a Hadith
type Hadith struct {
    HadithID string `json:"hadithId"`
    // Add other fields as required
}

// AddHadith adds a new Hadith to the ledger
func (hc *HadithContract) AddHadith(ctx contractapi.TransactionContextInterface, hadithData string) (string, error) {
    var hadith Hadith
    err := json.Unmarshal([]byte(hadithData), &hadith)
    if err != nil {
        return "", fmt.Errorf("failed to unmarshal hadith data: %v", err)
    }

    exists, err := hc.HadithExists(ctx, hadith.HadithID)
    if err != nil {
        return "", fmt.Errorf("failed to check if hadith exists: %v", err)
    }
    if exists {
        return "", fmt.Errorf("hadith with ID %s already exists", hadith.HadithID)
    }

    err = ctx.GetStub().PutState(hadith.HadithID, []byte(hadithData))
    if err != nil {
        return "", fmt.Errorf("failed to add hadith: %v", err)
    }

    return ctx.GetStub().GetTxID(), nil
}

// HadithExists checks if a Hadith with the given ID exists
func (hc *HadithContract) HadithExists(ctx contractapi.TransactionContextInterface, hadithID string) (bool, error) {
    hadithData, err := ctx.GetStub().GetState(hadithID)
    if err != nil {
        return false, fmt.Errorf("failed to read hadith data: %v", err)
    }
    return hadithData != nil, nil
}

func main() {
    chaincode, err := contractapi.NewChaincode(&HadithContract{})
    if err != nil {
        fmt.Printf("Error creating Hadith contract chaincode: %v", err)
        return
    }

    if err := chaincode.Start(); err != nil {
        fmt.Printf("Error starting Hadith contract chaincode: %v", err)
    }
}