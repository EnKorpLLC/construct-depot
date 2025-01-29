import { OrderStatus } from '../../frontend/src/types/order';

describe('Order Management System', () => {
  beforeEach(() => {
    // Reset database and seed test data
    cy.task('db:reset');
    cy.task('db:seed');
    
    // Login as test user
    cy.login('test@example.com', 'password123');
    cy.visit('/orders');
  });

  it('should display list of orders', () => {
    cy.get('.orders-table').should('exist');
    cy.get('.orders-table tbody tr').should('have.length.at.least', 1);
  });

  it('should filter orders by status', () => {
    // Select DRAFT status
    cy.get('select').select('DRAFT');
    cy.get('.orders-table tbody tr').each(($row) => {
      cy.wrap($row).find('.order-status').should('contain', 'DRAFT');
    });
  });

  it('should create new order', () => {
    cy.get('[data-cy=create-order]').click();
    
    // Fill order form
    cy.get('[data-cy=product-select]').select('Test Product');
    cy.get('[data-cy=quantity]').type('2');
    cy.get('[data-cy=submit-order]').click();

    // Verify order creation
    cy.get('.orders-table tbody tr').first().within(() => {
      cy.get('.order-status').should('contain', 'DRAFT');
      cy.get('.order-items').should('contain', '1 items');
    });
  });

  it('should update order status', () => {
    // Find first DRAFT order
    cy.get('.orders-table tbody tr')
      .filter(':contains("DRAFT")')
      .first()
      .within(() => {
        // Click "Mark as POOLING" button
        cy.contains('Mark as POOLING').click();
        
        // Verify status update
        cy.get('.order-status').should('contain', 'POOLING');
      });
  });

  it('should handle invalid status transitions', () => {
    // Try to complete a DRAFT order (invalid transition)
    cy.get('.orders-table tbody tr')
      .filter(':contains("DRAFT")')
      .first()
      .within(() => {
        // Verify COMPLETED is not an available action
        cy.contains('Mark as COMPLETED').should('not.exist');
      });
  });

  it('should update in real-time when order status changes', () => {
    // Open two browser windows
    cy.window().then((win) => {
      // Create new window
      const newWindow = cy.visit('/orders');
      
      // Update order in first window
      cy.get('.orders-table tbody tr')
        .filter(':contains("DRAFT")')
        .first()
        .within(() => {
          cy.contains('Mark as POOLING').click();
        });

      // Verify update in second window
      newWindow.get('.orders-table tbody tr')
        .filter(':contains("POOLING")')
        .should('exist');
    });
  });

  it('should handle errors gracefully', () => {
    // Simulate network error
    cy.intercept('PUT', '/api/orders/*', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    });

    // Try to update order
    cy.get('.orders-table tbody tr')
      .filter(':contains("DRAFT")')
      .first()
      .within(() => {
        cy.contains('Mark as POOLING').click();
        
        // Verify error handling
        cy.get('.error-message').should('be.visible');
      });
  });
}); 