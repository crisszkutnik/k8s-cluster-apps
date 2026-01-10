package expense

import (
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/google/uuid"
)

type ExpenseController struct {
	expenseService *ExpenseService
}

func NewExpenseController(expenseService *ExpenseService) *ExpenseController {
	return &ExpenseController{
		expenseService: expenseService,
	}
}

func (c *ExpenseController) GetInsertInformation(ctx fiber.Ctx) error {
	// userID, err := uuid.Parse(ctx.Params("userId"))
	userID := uuid.MustParse("01961fcb-6ff5-727f-82d9-09b22b437a0d")

	/*
		if err != nil {
			return ctx.Status(400).JSON(fiber.Map{"error": "invalid user id"})
		}
	*/

	withRecurrent := ctx.Query("withRecurrent", "false") == "true"

	info, err := c.expenseService.GetExpenseInsertInformation(ctx.Context(), userID, withRecurrent)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(fiber.StatusOK).JSON(info)
}

func (c *ExpenseController) AddExpense(ctx fiber.Ctx) error {
	// TODO: Replace with actual user ID from auth/context
	userID := uuid.MustParse("01961fcb-6ff5-727f-82d9-09b22b437a0d")

	var payload ExpensePayload
	if err := ctx.Bind().Body(&payload); err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if payload.ArsAmount == 0 || payload.UsdAmount == 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ARS and USD have to be greater than 0"})
	}

	response, err := c.expenseService.AddExpense(ctx.Context(), userID, &payload)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Info("Added expense")

	return ctx.Status(fiber.StatusCreated).JSON(response)
}

func (c *ExpenseController) GetExpenses(ctx fiber.Ctx) error {
	// TODO: Replace with actual user ID from auth/context
	userID := uuid.MustParse("01961fcb-6ff5-727f-82d9-09b22b437a0d")
	log.Info("Payload received")

	startDate := ctx.Query("startDate")
	if startDate == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "startDate query parameter is required (format: YYYY-MM-DD)"})
	}

	endDate := ctx.Query("endDate")
	if endDate == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "endDate query parameter is required (format: YYYY-MM-DD)"})
	}

	expenses, err := c.expenseService.GetExpenses(ctx.Context(), userID, startDate, endDate)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	log.Info("Query ended")
	return ctx.Status(fiber.StatusOK).JSON(expenses)
}
