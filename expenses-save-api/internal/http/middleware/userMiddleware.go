package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

const UserIDContextKey = "userID"

func UserIDMiddleware() fiber.Handler {
	return func(c fiber.Ctx) error {
		userIDStr := c.Get("internal-user-id")
		if userIDStr == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "internal-user-id header is required",
			})
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid user ID format",
			})
		}

		c.Locals(UserIDContextKey, userID)
		return c.Next()
	}
}

func GetUserIDFromContext(c fiber.Ctx) (uuid.UUID, error) {
	userID, ok := c.Locals(UserIDContextKey).(uuid.UUID)
	if !ok {
		return uuid.Nil, fiber.NewError(fiber.StatusInternalServerError, "user ID not found in context")
	}
	return userID, nil
}
