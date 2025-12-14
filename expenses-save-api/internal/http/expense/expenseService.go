package expense

import (
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/google/uuid"
)

type ExpenseService struct {
	dbService *database.DatabaseService
}

func NewExpenseService(dbService *database.DatabaseService) *ExpenseService {
	return &ExpenseService{dbService: dbService}
}

func (s *ExpenseService) GetExpenses(userID uuid.UUID) ([]*database.Expense, error) {
	return s.dbService.GetExpenses(userID)
}
