package dollar

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"sync"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
)

type DollarService struct {
	client     *http.Client
	cache      *exchangeRateCache
	apiBaseURL string
}

type exchangeRateCache struct {
	rate      float64
	timestamp time.Time
	mutex     sync.RWMutex
}

func NewDollarService() (*DollarService, error) {
	service := &DollarService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		cache:      &exchangeRateCache{},
		apiBaseURL: *env.STOCK_MARKET_API_URL,
	}

	err := service.UpdateRate()

	if err != nil {
		return nil, err
	}

	return service, nil
}

func (s *DollarService) GetExchangeRate() (float64, error) {
	s.cache.mutex.RLock()

	if !s.isCacheExpired() {
		rate := s.cache.rate
		s.cache.mutex.RUnlock()
		return rate, nil
	}

	s.cache.mutex.RUnlock()

	s.cache.mutex.Lock()
	defer s.cache.mutex.Unlock()

	// Double check if cache was updated while waiting for lock
	if !s.isCacheExpired() {
		return s.cache.rate, nil
	}

	err := s.UpdateRate()

	if err != nil {
		return 0, err
	}

	return s.cache.rate, nil
}

func (s *DollarService) UpdateRate() error {
	rate, err := s.getBondExchangeRate()
	if err != nil {
		return fmt.Errorf("failed to fetch exchange rate: %v", err)
	}

	s.cache.rate = rate
	s.cache.timestamp = time.Now()
	log.Printf("exchange rate updated. USD/ARS: %f", rate)

	return nil
}

func (s *DollarService) isCacheExpired() bool {
	if s.cache.rate == 0 {
		return true
	}

	return time.Since(s.cache.timestamp) > time.Duration(*env.EXCHANGE_RATE_TTL)*time.Minute
}

func (s *DollarService) getBondPrice(ticker string) (float64, error) {
	type bondRequest struct {
		Market    string `json:"market"`
		Ticker    string `json:"ticker"`
		AssetType string `json:"assetType"`
	}

	type bondResponse struct {
		Value               float64 `json:"value"`
		Change              float64 `json:"change"`
		ChangePct           float64 `json:"changePct"`
		Ticker              string  `json:"ticker"`
		Market              string  `json:"market"`
		AssetType           *string `json:"assetType"`
		UnitsForTickerPrice int     `json:"unitsForTickerPrice"`
		Currency            string  `json:"currency"`
		Source              string  `json:"source"`
	}

	payload := bondRequest{
		Market:    "BCBA",
		Ticker:    ticker,
		AssetType: "BOND",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal %s request payload: %v", ticker, err)
	}

	resp, err := s.client.Post(s.apiBaseURL, "application/json", bytes.NewReader(jsonData))
	if err != nil {
		return 0, fmt.Errorf("failed to fetch %s price: %v", ticker, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("API returned non-200 status code for %s: %d", ticker, resp.StatusCode)
	}

	var bondResp bondResponse
	if err := json.NewDecoder(resp.Body).Decode(&bondResp); err != nil {
		return 0, fmt.Errorf("failed to decode %s response: %v", ticker, err)
	}

	return bondResp.Value, nil
}

func (s *DollarService) getBondExchangeRate() (float64, error) {
	type result struct {
		price float64
		err   error
	}

	al30Chan := make(chan result)
	al30dChan := make(chan result)

	go func() {
		price, err := s.getBondPrice("AL30")
		al30Chan <- result{price: price, err: err}
	}()

	go func() {
		price, err := s.getBondPrice("AL30D")
		al30dChan <- result{price: price, err: err}
	}()

	al30Result := <-al30Chan
	if al30Result.err != nil {
		return 0, al30Result.err
	}

	al30dResult := <-al30dChan
	if al30dResult.err != nil {
		return 0, al30dResult.err
	}

	if al30dResult.price == 0 {
		return 0, fmt.Errorf("AL30D price cannot be zero")
	}

	exchangeRate := al30Result.price / al30dResult.price

	roundedRate := math.Round(exchangeRate*100) / 100

	return roundedRate, nil
}
