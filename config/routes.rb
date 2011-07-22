Touring::Application.routes.draw do
  resources :days

  match "/auth/:provider/callback" => "sessions#create"  
  match "/signout" => "sessions#destroy", :as => :signout

  root :to => "days#index"
end
