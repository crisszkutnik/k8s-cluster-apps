package category

import (
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
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
	return s.categoryService.GetCategoriesByUserID(ctx, uuid.MustParse("01961fcb-6ff5-727f-82d9-09b22b437a0d"))
}
