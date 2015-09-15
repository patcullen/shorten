class Link
  include Mongoid::Document

  field :key, type: String
  field :url, type: String
  field :views, type: Integer

end

