package paymentmethod

import (
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/middleware"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/google/uuid"
)

type PaymentMethodController struct {
	paymentMethodService *PaymentMethodService
}

func NewPaymentMethodController(paymentMethodService *PaymentMethodService) *PaymentMethodController {
	return &PaymentMethodController{
		paymentMethodService: paymentMethodService,
	}
}

func (c *PaymentMethodController) GetPaymentMethods(ctx fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user ID not found in context"})
	}

	paymentMethods, err := c.paymentMethodService.GetByUserID(ctx.Context(), userID)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(fiber.StatusOK).JSON(paymentMethods)
}

func (c *PaymentMethodController) AddPaymentMethod(ctx fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user ID not found in context"})
	}

	var payload PaymentMethodPayload
	if err := ctx.Bind().Body(&payload); err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if payload.Name == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}

	pm, err := c.paymentMethodService.Insert(ctx.Context(), userID, &payload)
	if err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Info("Added payment method")

	return ctx.Status(fiber.StatusCreated).JSON(pm)
}

func (c *PaymentMethodController) UpdatePaymentMethod(ctx fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user ID not found in context"})
	}

	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payment method ID"})
	}

	var payload PaymentMethodPayload
	if err := ctx.Bind().Body(&payload); err != nil {
		log.Error(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if payload.Name == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}

	pm, err := c.paymentMethodService.Update(ctx.Context(), id, userID, &payload)
	if err != nil {
		log.Error(err)
		if err.Error() == "payment method not found" {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Info("Updated payment method")

	return ctx.Status(fiber.StatusOK).JSON(pm)
}
