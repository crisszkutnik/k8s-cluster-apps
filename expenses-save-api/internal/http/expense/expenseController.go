package expense

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ExpenseController struct {
	expenseService *ExpenseService
}

func NewExpenseController(expenseService *ExpenseService) *ExpenseController {
	return &ExpenseController{expenseService: expenseService}
}

func (c *ExpenseController) GetExpenses(ctx fiber.Ctx) error {
	expenses, err := c.expenseService.GetExpenses(uuid.MustParse("01961fcb-6ff5-727f-82d9-09b22b437a0d"))

	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(expenses)
}
