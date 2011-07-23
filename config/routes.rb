Touring::Application.routes.draw do
  resources :trips
  resources :users
  resources :days

  match "/auth/:provider/callback" => "sessions#create"  
  match "/signout" => "sessions#destroy", :as => :signout

  root :to => "days#index"
end
