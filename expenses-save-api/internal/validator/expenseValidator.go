package validator

import (
	"fmt"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/proto"
	"github.com/google/uuid"
)

type ValidationError struct {
	Field   string
	Message string
	Err     error
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation error in field '%s': %s", e.Field, e.Message)
}

func (e *ValidationError) Unwrap() error {
	return e.Err
}

type ExpenseValidatorService struct {
	dbService *database.DatabaseService
}

func NewExpenseValidatorService(dbService *database.DatabaseService) (*ExpenseValidatorService, error) {
	return &ExpenseValidatorService{dbService: dbService}, nil
}

// TODO: Try to perform DB operation at the same time so it is faster. Maybe some subroutines and channels to sync
func (s *ExpenseValidatorService) GetExpenseFromRequest(userID uuid.UUID, req *proto.NewExpenseRequest) (*database.Expense, error) {
	paymentMethod, err := s.dbService.GetPaymentMethodByName(userID, req.ExpenseInfo.PaymentMethodName)
	if err != nil {
		return nil, &ValidationError{
			Field:   "paymentMethodName",
			Message: "database error while looking up payment method",
			Err:     err,
		}
	}
	if paymentMethod == nil {
		return nil, &ValidationError{
			Field:   "paymentMethodName",
			Message: fmt.Sprintf("payment method '%s' not found for user", req.ExpenseInfo.PaymentMethodName),
			Err:     fmt.Errorf("payment method not found"),
		}
	}

	category, err := s.dbService.GetCategoryByName(userID, req.ExpenseInfo.CategoryName)
	if err != nil {
		return nil, &ValidationError{
			Field:   "categoryName",
			Message: "database error while looking up category",
			Err:     err,
		}
	}
	if category == nil {
		return nil, &ValidationError{
			Field:   "categoryName",
			Message: fmt.Sprintf("category '%s' not found for user", req.ExpenseInfo.CategoryName),
			Err:     fmt.Errorf("category not found"),
		}
	}

	var subcategoryID *uuid.UUID
	if req.ExpenseInfo.SubcategoryName != "" {
		subcategory, err := s.dbService.GetSubcategoryByName(category.Id, req.ExpenseInfo.SubcategoryName)
		if err != nil {
			return nil, &ValidationError{
				Field:   "subcategoryName",
				Message: "database error while looking up subcategory",
				Err:     err,
			}
		}
		if subcategory == nil {
			return nil, &ValidationError{
				Field:   "subcategoryName",
				Message: fmt.Sprintf("subcategory '%s' not found for category '%s'", req.ExpenseInfo.SubcategoryName, req.ExpenseInfo.CategoryName),
				Err:     fmt.Errorf("subcategory not found"),
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
		return time.Time{}, &ValidationError{
			Field:   "date",
			Message: "invalid date format, expected YYYY-MM-DD",
			Err:     err,
		}
	}
	return date, nil
}

func (s *ExpenseValidatorService) parseAmount(req *proto.NewExpenseRequest) (float64, float64, error) {
	// TODO: Get conversion rate from API and use it here
	var arsAmount, usdAmount float64

	switch req.ExpenseInfo.Currency {
	case "ARS":
		arsAmount = float64(req.ExpenseInfo.Amount)
	case "USD":
		usdAmount = float64(req.ExpenseInfo.Amount)
	default:
		return 0, 0, &ValidationError{
			Field:   "currency",
			Message: fmt.Sprintf("unsupported currency: %s (supported: ARS, USD)", req.ExpenseInfo.Currency),
			Err:     fmt.Errorf("unsupported currency: %s", req.ExpenseInfo.Currency),
		}
	}

	return arsAmount, usdAmount, nil
}
