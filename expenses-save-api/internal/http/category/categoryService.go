package category

import (
	"context"
	"fmt"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CategoryService struct {
	categoryRepo *repository.CategoryRepository
}

type CategoryPayload struct {
	Name string `json:"name" validate:"required"`
}

func NewCategoryService(categoryRepo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{
		categoryRepo: categoryRepo,
	}
}

func (s *CategoryService) GetCategoriesByUserID(ctx context.Context, userID uuid.UUID) ([]database.Category, error) {
	return s.categoryRepo.GetByUserID(ctx, userID)
}

func (s *CategoryService) Insert(ctx context.Context, userID uuid.UUID, payload *CategoryPayload) (*database.Category, error) {
	c, err := s.categoryRepo.Insert(ctx, userID, payload.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to insert category: %w", err)
	}

	return c, nil
}

func (s *CategoryService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, payload *CategoryPayload) (*database.Category, error) {
	c, err := s.categoryRepo.Update(ctx, id, userID, payload.Name)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("category not found")
		}
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	return c, nil
}
