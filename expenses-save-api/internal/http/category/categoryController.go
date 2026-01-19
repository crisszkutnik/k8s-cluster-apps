package category

import (
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/http/middleware"
	"github.com/gofiber/fiber/v3"
)

type CategoryController struct {
	categoryService *CategoryService
}

func NewCategoryController(categoryService *CategoryService) *CategoryController {
	return &CategoryController{
		categoryService: categoryService,
	}
}

func (s *CategoryController) GetCategoriesByUserID(ctx fiber.Ctx) ([]database.Category, error) {
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	return s.categoryService.GetCategoriesByUserID(ctx, userID)
}
