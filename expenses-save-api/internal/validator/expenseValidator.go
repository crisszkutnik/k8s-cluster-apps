package validator

import (
	"fmt"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/dollar"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/errors"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/proto"
	"github.com/google/uuid"
)

type ExpenseValidatorService struct {
	dbService     *database.DatabaseService
	dollarService *dollar.DollarService
}

func NewExpenseValidatorService(dbService *database.DatabaseService, dollarService *dollar.DollarService) (*ExpenseValidatorService, error) {
	return &ExpenseValidatorService{dbService: dbService, dollarService: dollarService}, nil
}

// TODO: Try to perform DB operation at the same time so it is faster. Maybe some subroutines and channels to sync
func (s *ExpenseValidatorService) GetExpenseFromRequest(userID uuid.UUID, req *proto.NewExpenseRequest) (*database.Expense, error) {
	paymentMethod, err := s.dbService.GetPaymentMethodByName(userID, req.ExpenseInfo.PaymentMethodName)
	if err != nil {
		return nil, err
	}
	if paymentMethod == nil {
		return nil, &errors.ValidationError{
			Field:   "paymentMethodName",
			Message: fmt.Sprintf("payment method '%s' not found for user", req.ExpenseInfo.PaymentMethodName),
			Code:    int32(errors.InvalidPaymentMethod),
		}
	}

	category, err := s.dbService.GetCategoryByName(userID, req.ExpenseInfo.CategoryName)
	if err != nil {
		return nil, err
	}
	if category == nil {
		return nil, &errors.ValidationError{
			Field:   "categoryName",
			Message: fmt.Sprintf("category '%s' not found for user", req.ExpenseInfo.CategoryName),
			Code:    int32(errors.InvalidCategory),
		}
	}

	var subcategoryID *uuid.UUID
	if req.ExpenseInfo.SubcategoryName != "" {
		subcategory, err := s.dbService.GetSubcategoryByName(category.Id, req.ExpenseInfo.SubcategoryName)
		if err != nil {
			return nil, err
		}
		if subcategory == nil {
			return nil, &errors.ValidationError{
				Field:   "subcategoryName",
				Message: fmt.Sprintf("subcategory '%s' not found for category '%s'", req.ExpenseInfo.SubcategoryName, req.ExpenseInfo.CategoryName),
				Code:    int32(errors.InvalidSubcategory),
			}
		}
		subcategoryID = &subcategory.Id
	}

	date, err := s.parseDate(req)
	if err != nil {
		return nil, err
	}

	arsAmount, usdAmount, err := s.parseAmount(req)
	if err != nil {
		return nil, err
	}

	expense := &database.Expense{
		UserID:          userID,
		Description:     req.ExpenseInfo.Name,
		PaymentMethodID: paymentMethod.Id,
		ARSAmount:       arsAmount,
		USDAmount:       usdAmount,
		CategoryID:      category.Id,
		SubcategoryID:   subcategoryID,
		Date:            date,
	}

	return expense, nil
}

func (s *ExpenseValidatorService) parseDate(req *proto.NewExpenseRequest) (time.Time, error) {
	date, err := time.Parse("2006-01-02", req.ExpenseInfo.Date)
	if err != nil {
		return time.Time{}, &errors.ValidationError{
			Field:   "date",
			Message: fmt.Sprintf("invalid date format, expected YYYY-MM-DD found %s", req.ExpenseInfo.Date),
			Code:    int32(errors.InvalidDate),
		}
	}
	return date, nil
}

func (s *ExpenseValidatorService) parseAmount(req *proto.NewExpenseRequest) (float64, float64, error) {
	usdToArs, err := s.dollarService.GetExchangeRate()
	if err != nil {
		return 0, 0, err
	}

	var arsAmount, usdAmount float64

	switch req.ExpenseInfo.Currency {
	case "ARS":
		arsAmount = req.ExpenseInfo.Amount
		usdAmount = req.ExpenseInfo.Amount / usdToArs
	case "USD":
		arsAmount = req.ExpenseInfo.Amount * usdToArs
		usdAmount = req.ExpenseInfo.Amount
	default:
		return 0, 0, &errors.ValidationError{
			Field:   "currency",
			Message: fmt.Sprintf("unsupported currency: %s (supported: ARS, USD)", req.ExpenseInfo.Currency),
			Code:    int32(errors.InvalidCurrency),
		}
	}

	return arsAmount, usdAmount, nil
}
