Rails.application.routes.draw do

  root 'api#index'

  get 'api/index'
  post 'api/create'
  post 'api/scoreboard'

  get ':key' => 'api#view'

end

