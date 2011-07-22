Touring::Application.routes.draw do
  resources :days

  resource :session do
    collection do
      get 'callback'
    end
  end

  resources :examples do
    collection do
      get 'user'
      get 'checkins'
      get 'friends'
      get 'venues_search'
      get 'venue_details'
    end
  end

  root :to => "sessions#new"
end
